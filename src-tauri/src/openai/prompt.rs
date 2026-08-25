use crate::models::{Project, Student};

pub(super) fn build_prompt(project: &Project, student: &Student) -> String {
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{test_project, test_student};

    #[test]
    fn prompt_contains_project_student_and_safety_rules() {
        let prompt = build_prompt(&test_project(), &test_student());

        assert!(prompt.contains("평균 분량(420자)"));
        assert!(prompt.contains("[과목/영역] 국어"));
        assert!(prompt.contains("발표: 근거를 제시함"));
        assert!(prompt.contains("질문이 많음"));
        assert!(prompt.contains("식별정보는 출력하지 말 것"));
    }
}
