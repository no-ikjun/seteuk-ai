use anyhow::{anyhow, Result};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateBody {
    project: Project,
    student: Student,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Project {
    subject: String,
    theme: String,
    avg_length: i32,
    format: String,
    example: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Student {
    activity_text: String,
    extra_keywords: String,
}

#[derive(Debug, Serialize)]
struct GenerateResp {
    text: String,
}

fn validate_api_key_ascii(key: &str) -> Result<()> {
    if key.trim().is_empty() {
        return Err(anyhow!("OpenAI API Key가 비어 있습니다."));
    }
    if !key.starts_with("sk-") {
        return Err(anyhow!(
            "OpenAI API Key 형식이 이상합니다. (sk- 로 시작해야 합니다)"
        ));
    }

    for (index, character) in key.chars().enumerate() {
        if character as u32 > 0x7F {
            return Err(anyhow!(
        "OpenAI API Key에 ASCII가 아닌 문자가 포함되어 있습니다. (index {}) 키를 다시 복사해 주세요.",
        index
      ));
        }
    }
    Ok(())
}

fn build_prompt(project: &Project, student: &Student) -> String {
    format!(
        r#"[역할] 교사가 검토할 '교과 세부능력 특기사항(세특)' 초안을 작성한다.

[안전 규칙]
- 제공된 [학생 활동 기록]에 없는 사실을 만들어내지 말 것(추측/허위 금지).
- 과장 금지. 근거 기반 서술.
- 학생 실명/학번 등 식별정보는 출력하지 말 것.
- 평균 분량({}자)에 최대한 맞출 것(±20% 허용).

[과목/영역] {}
[주제] {}

[형식(교사가 지정)]
{}

[예시 글(톤/문장감/구성 참고. 내용은 학생 기록 기반으로 재작성)]
{}

[학생 활동 기록]
{}

[교사 추가 키워드(반영)]
{}

[출력]
- 세특 결과 문장만 출력
- 머리말/목차/해설/주의문구 없이 결과만
"#,
        project.avg_length,
        project.subject,
        project.theme,
        project.format,
        project.example,
        student.activity_text,
        student.extra_keywords
    )
}

fn extract_output_text(json: &serde_json::Value) -> Option<String> {
    json.get("output_text")
        .and_then(|value| value.as_str())
        .or_else(|| {
            json.get("output")
                .and_then(|value| value.as_array())
                .and_then(|items| items.first())
                .and_then(|item| item.get("content"))
                .and_then(|value| value.as_array())
                .and_then(|items| items.first())
                .and_then(|item| item.get("text"))
                .and_then(|value| value.as_str())
        })
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_owned)
}

#[tauri::command]
async fn generate(api_key: String, body: GenerateBody) -> Result<GenerateResp, String> {
    validate_api_key_ascii(&api_key).map_err(|error| error.to_string())?;
    let prompt = build_prompt(&body.project, &body.student);
    let request_body = serde_json::json!({
      "model": "gpt-4o",
      "input": prompt
    });

    let response = reqwest::Client::new()
        .post("https://api.openai.com/v1/responses")
        .header(CONTENT_TYPE, "application/json")
        .header(AUTHORIZATION, format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await
        .map_err(|error| format!("OpenAI 요청 실패: {}", error))?;

    let status = response.status();
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|error| format!("OpenAI 응답 파싱 실패: {}", error))?;

    if !status.is_success() {
        return Err(format!("OpenAI 에러(status={}): {}", status, json));
    }

    let text = extract_output_text(&json)
        .ok_or_else(|| "OpenAI 응답에 생성된 텍스트가 없습니다.".to_string())?;

    Ok(GenerateResp { text })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn project() -> Project {
        Project {
            subject: "국어".to_string(),
            theme: "독서 활동".to_string(),
            avg_length: 420,
            format: "교사 관찰자 시점".to_string(),
            example: "예시 문장".to_string(),
        }
    }

    fn student() -> Student {
        Student {
            activity_text: "발표: 근거를 제시함".to_string(),
            extra_keywords: "질문이 많음".to_string(),
        }
    }

    #[test]
    fn prompt_contains_project_student_and_safety_rules() {
        let prompt = build_prompt(&project(), &student());

        assert!(prompt.contains("평균 분량(420자)"));
        assert!(prompt.contains("[과목/영역] 국어"));
        assert!(prompt.contains("발표: 근거를 제시함"));
        assert!(prompt.contains("질문이 많음"));
        assert!(prompt.contains("식별정보는 출력하지 말 것"));
    }

    #[test]
    fn api_key_must_be_ascii_and_start_with_sk() {
        assert!(validate_api_key_ascii("sk-test").is_ok());
        assert!(validate_api_key_ascii("test").is_err());
        assert!(validate_api_key_ascii("sk-테스트").is_err());
    }

    #[test]
    fn extracts_supported_response_shapes_and_rejects_empty_text() {
        let direct = serde_json::json!({ "output_text": " 결과 " });
        let nested = serde_json::json!({
          "output": [{ "content": [{ "text": "중첩 결과" }] }]
        });
        let empty = serde_json::json!({ "output_text": "   " });

        assert_eq!(extract_output_text(&direct).as_deref(), Some("결과"));
        assert_eq!(extract_output_text(&nested).as_deref(), Some("중첩 결과"));
        assert_eq!(extract_output_text(&empty), None);
    }
}
