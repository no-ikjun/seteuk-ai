use std::time::Duration;

use reqwest::header::{ACCEPT, AUTHORIZATION};

use crate::{
    config::{MODEL_LIST_TIMEOUT_SECONDS, OPENAI_MODELS_URL},
    error::{AppError, AppResult},
    models::ModelInfo,
};

use super::client::{classify_api_error, classify_transport_error, validate_api_key};

/* 텍스트 생성이 아닌 모델을 걸러 낸다. 세특 초안은 Responses API의 텍스트
   출력만 사용하므로 임베딩·음성·이미지 계열은 목록에 올리지 않는다.
   OpenAI가 새 이름을 붙여도 목록에서 사라지지만 않도록, 차단 목록은
   좁게 두고 허용 조건을 우선한다. */
const EXCLUDED_MARKERS: &[&str] = &[
    "embedding",
    "tts",
    "whisper",
    "dall-e",
    "moderation",
    "audio",
    "realtime",
    "image",
    "transcribe",
    "-search",
    "codex",
    "sora",
    "computer-use",
    "instruct",
    "davinci",
    "babbage",
    "guard",
];

fn is_o_series(id: &str) -> bool {
    let mut chars = id.chars();
    chars.next() == Some('o') && chars.next().is_some_and(|c| c.is_ascii_digit())
}

pub(crate) fn is_text_generation_model(id: &str) -> bool {
    let id = id.to_ascii_lowercase();
    if EXCLUDED_MARKERS.iter().any(|marker| id.contains(marker)) {
        return false;
    }
    id.starts_with("gpt-") || is_o_series(&id)
}

fn parse_models(json: &serde_json::Value) -> Vec<ModelInfo> {
    let Some(entries) = json.get("data").and_then(serde_json::Value::as_array) else {
        return Vec::new();
    };
    let mut models: Vec<ModelInfo> = entries
        .iter()
        .filter_map(|entry| {
            let id = entry.get("id").and_then(serde_json::Value::as_str)?;
            if !is_text_generation_model(id) {
                return None;
            }
            Some(ModelInfo {
                id: id.to_owned(),
                created: entry
                    .get("created")
                    .and_then(serde_json::Value::as_i64)
                    .unwrap_or(0),
                owned_by: entry
                    .get("owned_by")
                    .and_then(serde_json::Value::as_str)
                    .unwrap_or_default()
                    .to_owned(),
            })
        })
        .collect();
    models.sort_by(|left, right| left.id.cmp(&right.id));
    models.dedup_by(|left, right| left.id == right.id);
    models
}

/* 계정이 실제로 쓸 수 있는 모델만 돌려준다. 화면에 고정 목록을 두면
   새 모델이 나올 때마다 앱을 새로 배포해야 하고, 반대로 권한이 없는
   모델을 고르면 생성 단계에 가서야 실패한다. */
pub(crate) async fn list_models(api_key: &str) -> AppResult<Vec<ModelInfo>> {
    validate_api_key(api_key)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(MODEL_LIST_TIMEOUT_SECONDS))
        .build()
        .map_err(|error| {
            AppError::new(
                "network",
                format!("OpenAI 요청 클라이언트를 만들 수 없습니다: {error}"),
                false,
            )
        })?;

    let response = client
        .get(OPENAI_MODELS_URL)
        .header(ACCEPT, "application/json")
        .header(AUTHORIZATION, format!("Bearer {api_key}"))
        .send()
        .await
        .map_err(|error| {
            classify_transport_error(
                error.is_timeout(),
                error.is_connect(),
                MODEL_LIST_TIMEOUT_SECONDS,
                &error.to_string(),
            )
        })?;

    let status = response.status();
    let response_text = response.text().await.map_err(|error| {
        AppError::new(
            "invalid_response",
            format!("OpenAI 응답을 읽을 수 없습니다: {error}"),
            false,
        )
    })?;
    let json: serde_json::Value = serde_json::from_str(&response_text).unwrap_or_default();

    if !status.is_success() {
        return Err(classify_api_error(status, &json));
    }

    let models = parse_models(&json);
    if models.is_empty() {
        return Err(AppError::new(
            "invalid_response",
            "사용할 수 있는 텍스트 생성 모델을 찾지 못했습니다.",
            false,
        ));
    }
    Ok(models)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_text_generation_models() {
        assert!(is_text_generation_model("gpt-4o"));
        assert!(is_text_generation_model("gpt-5.4-mini"));
        assert!(is_text_generation_model("o3"));
        assert!(is_text_generation_model("o4-mini"));
    }

    #[test]
    fn drops_non_text_models() {
        assert!(!is_text_generation_model("text-embedding-3-small"));
        assert!(!is_text_generation_model("gpt-4o-audio-preview"));
        assert!(!is_text_generation_model("gpt-realtime-2.1"));
        assert!(!is_text_generation_model("dall-e-3"));
        assert!(!is_text_generation_model("whisper-1"));
        assert!(!is_text_generation_model("gpt-3.5-turbo-instruct"));
        assert!(!is_text_generation_model("omni-moderation-latest"));
    }

    #[test]
    fn parses_and_sorts_model_list() {
        let json = serde_json::json!({
            "data": [
                { "id": "gpt-4o", "created": 20, "owned_by": "system" },
                { "id": "text-embedding-3-small", "created": 10, "owned_by": "system" },
                { "id": "gpt-5.4", "created": 30, "owned_by": "openai" }
            ]
        });
        let models = parse_models(&json);
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].id, "gpt-4o");
        assert_eq!(models[1].id, "gpt-5.4");
        assert_eq!(models[1].created, 30);
    }

    #[test]
    fn parses_empty_payload_without_panic() {
        assert!(parse_models(&serde_json::json!({})).is_empty());
    }
}
