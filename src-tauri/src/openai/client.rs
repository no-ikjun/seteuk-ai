use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::{
    header::{AUTHORIZATION, CONTENT_TYPE, RETRY_AFTER},
    StatusCode,
};

use crate::{
    config::{
        MAX_RETRIES, MAX_RETRY_AFTER_SECONDS, MAX_TIMEOUT_SECONDS, MIN_TIMEOUT_SECONDS,
        OPENAI_RESPONSES_URL,
    },
    error::{AppError, AppResult},
    models::{GenerationRequest, GenerationResult, GenerationSettings, ReviseRequest},
};

use super::{
    prompt::{build_prompt, build_revise_prompt},
    response::extract_output_text,
};

pub(super) fn validate_api_key(key: &str) -> AppResult<()> {
    if key.trim().is_empty() {
        return Err(AppError::new(
            "authentication",
            "OpenAI API Key가 비어 있습니다.",
            false,
        ));
    }
    if !key.starts_with("sk-") {
        return Err(AppError::new(
            "authentication",
            "OpenAI API Key 형식이 이상합니다. (sk- 로 시작해야 합니다)",
            false,
        ));
    }
    if let Some((index, _)) = key
        .chars()
        .enumerate()
        .find(|(_, character)| !character.is_ascii())
    {
        return Err(AppError::new(
            "authentication",
            format!(
                "OpenAI API Key에 ASCII가 아닌 문자가 포함되어 있습니다. (index {index}) 키를 다시 복사해 주세요."
            ),
            false,
        ));
    }
    Ok(())
}

fn client_request_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("seeteuk-{}-{nanos}", std::process::id())
}

fn api_error_message(json: &serde_json::Value) -> String {
    json.pointer("/error/message")
        .and_then(serde_json::Value::as_str)
        .unwrap_or("OpenAI가 요청을 거부했습니다.")
        .to_owned()
}

fn api_error_code(json: &serde_json::Value) -> String {
    json.pointer("/error/code")
        .and_then(serde_json::Value::as_str)
        .or_else(|| {
            json.pointer("/error/type")
                .and_then(serde_json::Value::as_str)
        })
        .unwrap_or_default()
        .to_ascii_lowercase()
}

pub(super) fn classify_api_error(status: StatusCode, json: &serde_json::Value) -> AppError {
    let code = api_error_code(json);
    let api_message = api_error_message(json);
    if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN {
        return AppError::new(
            "authentication",
            "OpenAI API Key가 유효하지 않거나 권한이 없습니다. 키와 프로젝트 권한을 확인해 주세요.",
            false,
        );
    }
    let lower_message = api_message.to_ascii_lowercase();
    if status == StatusCode::TOO_MANY_REQUESTS
        && ["quota", "billing", "spend", "insufficient_quota"]
            .iter()
            .any(|marker| code.contains(marker) || lower_message.contains(marker))
    {
        return AppError::new(
            "quota",
            "OpenAI 사용 한도 또는 결제 한도에 도달했습니다. 계정의 Usage와 Billing을 확인해 주세요.",
            false,
        );
    }
    if status == StatusCode::TOO_MANY_REQUESTS {
        return AppError::new(
            "rate_limit",
            "OpenAI 요청 속도 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.",
            true,
        );
    }
    if status.is_server_error() {
        return AppError::new(
            "server",
            format!("OpenAI 서버가 일시적으로 요청을 처리하지 못했습니다. ({status})"),
            true,
        );
    }
    AppError::new(
        "invalid_request",
        format!("OpenAI 요청이 거부되었습니다. ({status}) {api_message}"),
        false,
    )
}

fn retry_after_seconds(value: Option<&reqwest::header::HeaderValue>) -> Option<u64> {
    value
        .and_then(|header| header.to_str().ok())
        .and_then(|text| text.parse::<u64>().ok())
        .map(|seconds| seconds.min(MAX_RETRY_AFTER_SECONDS))
}

fn backoff_duration(attempts: u32, retry_after: Option<u64>) -> Duration {
    if let Some(seconds) = retry_after {
        return Duration::from_secs(seconds);
    }
    let exponent = attempts.saturating_sub(1).min(5);
    Duration::from_millis(750_u64.saturating_mul(1_u64 << exponent))
}

pub(super) fn classify_transport_error(
    is_timeout: bool,
    is_connect: bool,
    timeout_seconds: u64,
    detail: &str,
) -> AppError {
    AppError::new(
        "network",
        if is_timeout {
            format!("OpenAI 요청이 {timeout_seconds}초 안에 완료되지 않았습니다.")
        } else {
            format!("OpenAI에 연결할 수 없습니다: {detail}")
        },
        is_timeout || is_connect,
    )
}

pub(crate) async fn generate(
    api_key: &str,
    body: &GenerationRequest,
) -> AppResult<GenerationResult> {
    request_text(
        api_key,
        &body.settings,
        build_prompt(&body.project, &body.student),
    )
    .await
}

/* 분량을 맞추는 재요청. 학생 기록을 다시 보내지 않고 이미 만들어진 문장만
줄이거나 늘린다. 교사가 이미 고쳐 둔 내용을 살리면서 분량만 맞출 수 있고,
보내는 양이 적어 비용도 낮다. */
pub(crate) async fn revise_length(
    api_key: &str,
    body: &ReviseRequest,
) -> AppResult<GenerationResult> {
    request_text(api_key, &body.settings, build_revise_prompt(body)).await
}

/* 생성과 재요청이 함께 쓰는 요청 경로. 타임아웃·재시도·오류 구분이 두 곳으로
갈라지면 한쪽만 고쳐지는 일이 생긴다. */
async fn request_text(
    api_key: &str,
    settings: &GenerationSettings,
    prompt: String,
) -> AppResult<GenerationResult> {
    validate_api_key(api_key)?;
    let model = settings.model.trim();
    if model.is_empty() {
        return Err(AppError::new(
            "invalid_request",
            "사용할 OpenAI 모델을 선택해 주세요.",
            false,
        ));
    }

    let timeout_seconds = settings
        .request_timeout_seconds
        .clamp(MIN_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS);
    let max_retries = settings.max_retries.min(MAX_RETRIES);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_seconds))
        .build()
        .map_err(|error| {
            AppError::new(
                "network",
                format!("OpenAI 요청 클라이언트를 만들 수 없습니다: {error}"),
                false,
            )
        })?;
    let request_body = serde_json::json!({
        "model": model,
        "input": prompt,
        "store": false
    });
    let client_request_id = client_request_id();

    for attempts in 1..=(max_retries + 1) {
        let response = client
            .post(OPENAI_RESPONSES_URL)
            .header(CONTENT_TYPE, "application/json")
            .header(AUTHORIZATION, format!("Bearer {api_key}"))
            .header("X-Client-Request-Id", &client_request_id)
            .json(&request_body)
            .send()
            .await;

        let response = match response {
            Ok(response) => response,
            Err(error) => {
                let app_error = classify_transport_error(
                    error.is_timeout(),
                    error.is_connect(),
                    timeout_seconds,
                    &error.to_string(),
                )
                .with_context(attempts, None);
                if app_error.retryable && attempts <= max_retries {
                    tokio::time::sleep(backoff_duration(attempts, None)).await;
                    continue;
                }
                return Err(app_error);
            }
        };

        let status = response.status();
        let request_id = response
            .headers()
            .get("x-request-id")
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned);
        let retry_after = retry_after_seconds(response.headers().get(RETRY_AFTER));
        let response_text = response.text().await.map_err(|error| {
            AppError::new(
                "invalid_response",
                format!("OpenAI 응답을 읽을 수 없습니다: {error}"),
                false,
            )
            .with_context(attempts, request_id.clone())
        })?;
        let json: serde_json::Value = serde_json::from_str(&response_text).map_err(|error| {
            AppError::new(
                "invalid_response",
                format!("OpenAI 응답 형식을 해석할 수 없습니다: {error}"),
                false,
            )
            .with_context(attempts, request_id.clone())
        })?;

        if !status.is_success() {
            let api_error =
                classify_api_error(status, &json).with_context(attempts, request_id.clone());
            if api_error.retryable && attempts <= max_retries {
                tokio::time::sleep(backoff_duration(attempts, retry_after)).await;
                continue;
            }
            return Err(api_error);
        }

        let text = extract_output_text(&json).ok_or_else(|| {
            AppError::new(
                "invalid_response",
                "OpenAI 응답에 생성된 텍스트가 없습니다.",
                false,
            )
            .with_context(attempts, request_id)
        })?;
        return Ok(GenerationResult { text, attempts });
    }

    unreachable!("재시도 루프는 반드시 결과를 반환합니다")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn api_key_must_be_ascii_and_start_with_sk() {
        assert!(validate_api_key("sk-test").is_ok());
        assert!(validate_api_key("test").is_err());
        assert!(validate_api_key("sk-테스트").is_err());
    }

    #[test]
    fn distinguishes_rate_limit_from_quota_and_server_errors() {
        let rate = classify_api_error(
            StatusCode::TOO_MANY_REQUESTS,
            &serde_json::json!({ "error": { "code": "rate_limit_exceeded" } }),
        );
        let quota = classify_api_error(
            StatusCode::TOO_MANY_REQUESTS,
            &serde_json::json!({ "error": { "code": "insufficient_quota" } }),
        );
        let server = classify_api_error(StatusCode::SERVICE_UNAVAILABLE, &serde_json::json!({}));

        assert_eq!(rate.kind, "rate_limit");
        assert!(rate.retryable);
        assert_eq!(quota.kind, "quota");
        assert!(!quota.retryable);
        assert_eq!(server.kind, "server");
        assert!(server.retryable);
    }

    #[test]
    fn authentication_errors_are_not_retried() {
        let unauthorized = classify_api_error(
            StatusCode::UNAUTHORIZED,
            &serde_json::json!({ "error": { "message": "Incorrect API key" } }),
        );
        let forbidden = classify_api_error(StatusCode::FORBIDDEN, &serde_json::json!({}));

        assert_eq!(unauthorized.kind, "authentication");
        assert!(!unauthorized.retryable);
        assert_eq!(forbidden.kind, "authentication");
        assert!(!forbidden.retryable);
    }

    #[test]
    fn network_timeout_and_connection_failures_are_retryable() {
        let timeout = classify_transport_error(true, false, 15, "timed out");
        let disconnected = classify_transport_error(false, true, 15, "network is unreachable");
        let other = classify_transport_error(false, false, 15, "request body error");

        assert_eq!(timeout.kind, "network");
        assert!(timeout.message.contains("15초"));
        assert!(timeout.retryable);
        assert_eq!(disconnected.kind, "network");
        assert!(disconnected.message.contains("network is unreachable"));
        assert!(disconnected.retryable);
        assert!(!other.retryable);
    }

    #[test]
    fn caps_retry_after_and_uses_exponential_fallback() {
        let long = reqwest::header::HeaderValue::from_static("999");
        assert_eq!(retry_after_seconds(Some(&long)), Some(30));
        assert_eq!(backoff_duration(1, None), Duration::from_millis(750));
        assert_eq!(backoff_duration(2, None), Duration::from_millis(1500));
    }
}
