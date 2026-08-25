use serde::{Deserialize, Serialize};

use crate::{
    error::AppError,
    models::{GenerationRequest, GenerationSettings, Project, Student},
    openai,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GenerateRequestDto {
    project: ProjectDto,
    settings: GenerationSettingsDto,
    student: StudentDto,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerationSettingsDto {
    model: String,
    request_timeout_seconds: u64,
    max_retries: u32,
    #[allow(dead_code)]
    batch_delay_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectDto {
    subject: String,
    theme: String,
    avg_length: i32,
    format: String,
    example: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StudentDto {
    activity_text: String,
    extra_keywords: String,
}

#[derive(Debug, Serialize)]
pub(crate) struct GenerateResponseDto {
    text: String,
    attempts: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GenerateErrorDto {
    kind: &'static str,
    message: String,
    retryable: bool,
    attempts: u32,
    request_id: Option<String>,
}

impl From<AppError> for GenerateErrorDto {
    fn from(error: AppError) -> Self {
        Self {
            kind: error.kind,
            message: error.message,
            retryable: error.retryable,
            attempts: error.attempts,
            request_id: error.request_id,
        }
    }
}

impl From<GenerateRequestDto> for GenerationRequest {
    fn from(request: GenerateRequestDto) -> Self {
        Self {
            project: Project {
                subject: request.project.subject,
                theme: request.project.theme,
                avg_length: request.project.avg_length,
                format: request.project.format,
                example: request.project.example,
            },
            settings: GenerationSettings {
                model: request.settings.model,
                request_timeout_seconds: request.settings.request_timeout_seconds,
                max_retries: request.settings.max_retries,
            },
            student: Student {
                activity_text: request.student.activity_text,
                extra_keywords: request.student.extra_keywords,
            },
        }
    }
}

#[tauri::command]
pub(crate) async fn generate(
    api_key: String,
    body: GenerateRequestDto,
) -> Result<GenerateResponseDto, GenerateErrorDto> {
    let result = openai::client::generate(&api_key, &body.into())
        .await
        .map_err(GenerateErrorDto::from)?;
    Ok(GenerateResponseDto {
        text: result.text,
        attempts: result.attempts,
    })
}
