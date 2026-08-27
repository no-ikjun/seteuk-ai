use serde::{Deserialize, Serialize};

use crate::{
    error::AppError,
    models::{
        GenerationRequest, GenerationSettings, Project, RecordType, ReviseRequest, SchoolLevel,
        Student,
    },
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

/* 화면에서 고른 학교급과 기록 항목. 프롬프트의 작성 기준과 금지 사항이
이 두 값으로 갈린다. */
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
enum SchoolLevelDto {
    Elementary,
    Middle,
    High,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
enum RecordTypeDto {
    Subject,
    Autonomy,
    Club,
    Career,
    Behavior,
}

impl From<SchoolLevelDto> for SchoolLevel {
    fn from(value: SchoolLevelDto) -> Self {
        match value {
            SchoolLevelDto::Elementary => SchoolLevel::Elementary,
            SchoolLevelDto::Middle => SchoolLevel::Middle,
            SchoolLevelDto::High => SchoolLevel::High,
        }
    }
}

impl From<RecordTypeDto> for RecordType {
    fn from(value: RecordTypeDto) -> Self {
        match value {
            RecordTypeDto::Subject => RecordType::Subject,
            RecordTypeDto::Autonomy => RecordType::Autonomy,
            RecordTypeDto::Club => RecordType::Club,
            RecordTypeDto::Career => RecordType::Career,
            RecordTypeDto::Behavior => RecordType::Behavior,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectDto {
    school_level: SchoolLevelDto,
    record_type: RecordTypeDto,
    subject: String,
    theme: String,
    target_bytes: i32,
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
                school_level: request.project.school_level.into(),
                record_type: request.project.record_type.into(),
                subject: request.project.subject,
                theme: request.project.theme,
                target_bytes: request.project.target_bytes,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ReviseRequestDto {
    settings: GenerationSettingsDto,
    school_level: SchoolLevelDto,
    record_type: RecordTypeDto,
    text: String,
    target_chars: i32,
}

impl From<ReviseRequestDto> for ReviseRequest {
    fn from(request: ReviseRequestDto) -> Self {
        Self {
            settings: GenerationSettings {
                model: request.settings.model,
                request_timeout_seconds: request.settings.request_timeout_seconds,
                max_retries: request.settings.max_retries,
            },
            school_level: request.school_level.into(),
            record_type: request.record_type.into(),
            text: request.text,
            target_chars: request.target_chars,
        }
    }
}

/* 분량만 맞추는 재요청. 학생 활동 기록을 다시 보내지 않으므로 개인정보가
   추가로 나가지 않는다. */
#[tauri::command]
pub(crate) async fn revise_length(
    api_key: String,
    body: ReviseRequestDto,
) -> Result<GenerateResponseDto, GenerateErrorDto> {
    let result = openai::client::revise_length(&api_key, &body.into())
        .await
        .map_err(GenerateErrorDto::from)?;
    Ok(GenerateResponseDto {
        text: result.text,
        attempts: result.attempts,
    })
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
