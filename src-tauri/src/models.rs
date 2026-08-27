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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SchoolLevel {
    Elementary,
    Middle,
    High,
}

/* 학교생활기록부에서 이 앱이 초안을 쓰는 서술형 항목.
항목마다 기재요령이 요구하는 서술의 초점과 금지 사항이 달라서
프롬프트를 하나로 합칠 수 없다. */
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RecordType {
    /// 교과학습발달상황 세부능력 및 특기사항(초등은 성취수준 및 특기사항)
    Subject,
    /// 창의적 체험활동 자율·자치활동(초등은 동아리활동과 통합)
    Autonomy,
    /// 창의적 체험활동 동아리활동
    Club,
    /// 창의적 체험활동 진로활동
    Career,
    /// 행동특성 및 종합의견
    Behavior,
}

pub(crate) struct Project {
    pub(crate) school_level: SchoolLevel,
    pub(crate) record_type: RecordType,
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

pub(crate) struct ModelInfo {
    pub(crate) id: String,
    pub(crate) created: i64,
    pub(crate) owned_by: String,
}

pub(crate) struct GenerationResult {
    pub(crate) text: String,
    pub(crate) attempts: u32,
}

#[cfg(test)]
pub(crate) fn test_project() -> Project {
    Project {
        school_level: SchoolLevel::High,
        record_type: RecordType::Subject,
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
