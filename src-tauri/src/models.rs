pub(crate) struct GenerationRequest {
    pub(crate) project: Project,
    pub(crate) settings: GenerationSettings,
    pub(crate) student: Student,
}

pub(crate) struct GenerationSettings {
    pub(crate) model: String,
    pub(crate) request_timeout_seconds: u64,
    pub(crate) max_retries: u32,
}

pub(crate) struct Project {
    pub(crate) subject: String,
    pub(crate) theme: String,
    pub(crate) avg_length: i32,
    pub(crate) format: String,
    pub(crate) example: String,
}

pub(crate) struct Student {
    pub(crate) activity_text: String,
    pub(crate) extra_keywords: String,
}

pub(crate) struct GenerationResult {
    pub(crate) text: String,
    pub(crate) attempts: u32,
}

#[cfg(test)]
pub(crate) fn test_project() -> Project {
    Project {
        subject: "국어".to_string(),
        theme: "독서 활동".to_string(),
        avg_length: 420,
        format: "교사 관찰자 시점".to_string(),
        example: "예시 문장".to_string(),
    }
}

#[cfg(test)]
pub(crate) fn test_student() -> Student {
    Student {
        activity_text: "발표: 근거를 제시함".to_string(),
        extra_keywords: "질문이 많음".to_string(),
    }
}
