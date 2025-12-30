#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::{anyhow, Result};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Deserialize)]
struct GenerateParams {
  apiKey: String,
  body: GenerateBody,
}

#[derive(Debug, Deserialize)]
struct GenerateBody {
  project: Project,
  student: Student,
}

#[derive(Debug, Deserialize)]
struct Project {
  subject: String,
  theme: String,
  avgLength: i32,
  format: String,
  example: String,
}

#[derive(Debug, Deserialize)]
struct Student {
  activityText: String,
  extraKeywords: String,
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
    return Err(anyhow!("OpenAI API Key 형식이 이상합니다. (sk- 로 시작해야 합니다)"));
  }
  // 헤더에 들어갈 값은 ASCII여야 안전(전에 터졌던 ByteString 이슈 방지)
  for (i, ch) in key.chars().enumerate() {
    if ch as u32 > 0x7F {
      return Err(anyhow!(
        "OpenAI API Key에 ASCII가 아닌 문자가 포함되어 있습니다. (index {}) 키를 다시 복사해 주세요.",
        i
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
    project.avgLength,
    project.subject,
    project.theme,
    project.format,
    project.example,
    student.activityText,
    student.extraKeywords
  )
}

#[tauri::command]
async fn generate(api_key: String, body: GenerateBody) -> Result<GenerateResp, String> {
  if let Err(e) = validate_api_key_ascii(&api_key) {
    return Err(e.to_string());
  }

  let prompt = build_prompt(&body.project, &body.student);

  let req_body = serde_json::json!({
    "model": "gpt-4o",
    "input": prompt
  });

  let client = reqwest::Client::new();
  let res = client
    .post("https://api.openai.com/v1/responses")
    .header(CONTENT_TYPE, "application/json")
    .header(AUTHORIZATION, format!("Bearer {}", api_key))
    .json(&req_body)
    .send()
    .await
    .map_err(|e| format!("OpenAI 요청 실패: {}", e))?;

  let status = res.status();
  let json: serde_json::Value = res
    .json()
    .await
    .map_err(|e| format!("OpenAI 응답 파싱 실패: {}", e))?;

  if !status.is_success() {
    return Err(format!("OpenAI 에러(status={}): {}", status, json));
  }

  let text = json
    .get("output_text")
    .and_then(|v| v.as_str())
    .map(|s| s.to_string())
    .or_else(|| {
      json.get("output")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.get(0))
        .and_then(|o| o.get("content"))
        .and_then(|c| c.as_array())
        .and_then(|carr| carr.get(0))
        .and_then(|c0| c0.get("text"))
        .and_then(|t| t.as_str())
        .map(|s| s.to_string())
    })
    .unwrap_or_else(|| "".to_string());

  Ok(GenerateResp { text })
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // stronghold: argon2 해시용 salt 파일 경로
      let app_data_dir = app
        .path()
        .app_local_data_dir()
        .expect("could not resolve app local data path");
      
      // 디렉토리가 없으면 생성
      std::fs::create_dir_all(&app_data_dir)
        .expect("could not create app local data directory");
      
      let salt_path = app_data_dir.join("salt.txt");

      // stronghold 플러그인 등록
      app.handle().plugin(
        tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build()
      )?;

      Ok(())
    })
    // store 플러그인 등록
    .plugin(tauri_plugin_store::Builder::new().build())
    // 기존 invoke 유지
    .invoke_handler(tauri::generate_handler![generate])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}