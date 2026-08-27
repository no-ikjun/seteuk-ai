use crate::models::{Project, RecordType, ReviseRequest, SchoolLevel, Student};

/* 2026학년도 학교생활기록부 기재요령(교육부훈령 제555호)에서 옮겨 온 규칙이다.
항목과 학교급마다 요구하는 서술의 초점과 금지 사항이 달라서, 프롬프트를 한
덩어리 문자열로 두지 않고 규칙을 자료로 두고 조립한다. */

fn level_name(level: SchoolLevel) -> &'static str {
    match level {
        SchoolLevel::Elementary => "초등학교",
        SchoolLevel::Middle => "중학교",
        SchoolLevel::High => "고등학교",
    }
}

pub(super) fn record_name(level: SchoolLevel, record: RecordType) -> &'static str {
    match record {
        // 초등학교만 교과학습발달상황의 서술 항목 이름이 다르다.
        RecordType::Subject => match level {
            SchoolLevel::Elementary => "교과학습발달상황 성취수준 및 특기사항",
            _ => "교과학습발달상황 과목별 세부능력 및 특기사항",
        },
        // 초등학교는 자율·자치활동과 동아리활동 특기사항을 통합해 입력한다.
        RecordType::Autonomy => match level {
            SchoolLevel::Elementary => "창의적 체험활동 자율·자치활동 및 동아리활동 특기사항",
            _ => "창의적 체험활동 자율·자치활동 특기사항",
        },
        RecordType::Club => "창의적 체험활동 동아리활동 특기사항",
        RecordType::Career => "창의적 체험활동 진로활동 특기사항",
        RecordType::Behavior => "행동특성 및 종합의견",
    }
}

/// 항목이 요구하는 서술의 초점. 기재요령의 해당 조문을 옮긴 것이다.
fn record_guidance(level: SchoolLevel, record: RecordType) -> &'static str {
    match record {
        RecordType::Subject => match level {
            SchoolLevel::Elementary => {
                "- 교과(목) 및 학교자율시간 활동별 성취기준에 따른 학생의 성취수준 특성을 문장으로 쓴다.\n\
                 - 특기할 만한 사항이 있으면 그 내용을 함께 쓴다."
            }
            _ => {
                "- 학생참여형 수업과 수업에 연계된 수행평가 등에서 관찰한 내용을 바탕으로 쓴다.\n\
                 - 과목별 성취기준에 따른 성취수준의 특성, 학습활동 참여도, 자기주도적 학습에 의한 변화와 성장 정도를 중심에 둔다.\n\
                 - 학생 개인의 성취과정과 성취특성이 분명히 드러나게 쓴다.\n\
                 - 수업에서 이루어진 활동의 단순 나열, 성취기준에 이미 명시된 지식의 단순 서술은 쓰지 않는다."
            }
        },
        RecordType::Autonomy => {
            "- 활동 결과에 대한 평가보다 활동 과정에서 드러난 개별적인 행동 특성, 참여도, 협력도, 활동실적을 중심에 둔다.\n\
             - 학생이 실제로 맡은 역할과 활동을 위주로 쓴다."
        }
        RecordType::Club => {
            "- 참여도, 협력도, 열성도, 특별한 활동실적을 참고해 학생이 실제로 한 활동과 역할을 위주로 쓴다."
        }
        RecordType::Career => {
            "- 진로희망과 관련된 학생의 자질, 학생이 수행한 노력과 활동을 쓴다.\n\
             - 활동 참여도, 활동 의욕, 태도의 변화 등 진로활동과 관련된 사항을 담는다.\n\
             - 학생의 실제적인 활동과 역할을 위주로 쓴다."
        }
        RecordType::Behavior => {
            "- 학년 동안 지속적으로 관찰한 행동특성을 바탕으로 학생을 총체적으로 이해할 수 있게 쓴다.\n\
             - 학습, 행동, 인성 등 학교 교육활동 전반에서 관찰된 특성을 담는다.\n\
             - 성장 정도, 특기사항, 발전 가능성을 고려해 학생의 성장을 지원하는 교육적 관점에서 쓴다."
        }
    }
}

/// 대상 범위처럼 학교급에 따라서만 갈리는 단서.
fn level_note(level: SchoolLevel, record: RecordType) -> &'static str {
    match (level, record) {
        (SchoolLevel::High, RecordType::Subject) => {
            "- 고등학교는 모든 학생에 대해 입력하는 것이 원칙이다."
        }
        (SchoolLevel::Middle, RecordType::Subject) => {
            "- 중학교는 특기할 만한 사항이 있는 과목과 학생에 대해 입력한다."
        }
        (SchoolLevel::Elementary, RecordType::Career) => {
            "- 초등학교는 진로희망분야를 쓰지 않을 수 있다."
        }
        _ => "",
    }
}

/* 사교육 유발 요인이 커서 학교생활기록부 어떠한 항목에도 쓸 수 없는 사항.
<학교생활기록부 작성 시 유의사항> 3항과 4항이다. */
const COMMON_PROHIBITIONS: &str = "\
- 공인어학시험(TOEIC, TOEFL, TEPS, HSK, JPT, JLPT, DELF, DELE 등) 참여 사실과 그 성적 및 수상 실적
- 교과·비교과 관련 교내외 대회 참여 사실과 그 성적 및 수상 실적
- 교외 기관·단체에서 받은 상(표창장, 감사장, 공로상 포함)
- 교내외 인증시험 참여 사실이나 그 성적
- 논문을 학회지 등에 투고·등재하거나 학회에서 발표한 사실
- 도서 출간 사실
- 지식재산권(특허, 실용신안, 상표, 디자인) 출원 또는 등록 사실
- 어학연수, 해외 봉사 등 해외 활동실적과 관련 내용
- 부모나 친인척의 사회·경제적 지위(직종명, 직업명, 직장명, 직위명 등)를 암시하는 내용
- 장학생·장학금 관련 내용
- 구체적인 대학명, 기관명, 상호명, 강사명
- 자격증 명칭 및 취득 사실
- 학교명 등 학생이 재학한 학교를 알 수 있는 내용";

/// 항목별로 더해지는 금지 사항.
fn extra_prohibitions(level: SchoolLevel, record: RecordType) -> &'static str {
    match record {
        RecordType::Subject => match level {
            SchoolLevel::Elementary => {
                "- K-MOOC, MOOC, KOCW 등 관련 사항\n\
                 - 방과후학교 활동"
            }
            _ => {
                "- K-MOOC, MOOC, KOCW 등 관련 사항\n\
                 - 방과후학교 활동\n\
                 - 연구보고서(소논문) 관련 사항"
            }
        },
        RecordType::Autonomy | RecordType::Club | RecordType::Career => {
            "- 자율탐구활동 산출물(소논문 포함)의 제목, 연구 주제, 참여인원, 소요시간\n\
             - 학교교육과정에 편성하지 않은 영역의 활동"
        }
        // 다른 항목에 쓸 수 없는 내용은 행동특성 및 종합의견에도 쓸 수 없다.
        RecordType::Behavior => "- 방과후학교 활동 등 다른 항목에 입력할 수 없는 내용",
    }
}

/* 나이스는 입력을 Byte로 세지만(한글 1자 = 3Byte) 모델에게 Byte를 말하면
가늠하지 못한다. 세는 단위는 Byte로 두고, 지시는 한글 자 수로 바꿔 준다.
내림으로 바꿔 환산 과정에서 한도를 넘지 않게 한다. */
fn target_chars(target_bytes: i32) -> i32 {
    (target_bytes / 3).max(1)
}

fn section(title: &str, body: &str) -> String {
    if body.trim().is_empty() {
        return String::new();
    }
    format!("\n[{title}]\n{body}\n")
}

pub(super) fn build_prompt(project: &Project, student: &Student) -> String {
    let level = project.school_level;
    let record = project.record_type;

    format!(
        r#"[역할] {level_name} 학교생활기록부 '{record_name}'에 교사가 검토할 초안을 작성한다.
최종 판단과 입력은 교사가 하므로, 교사가 사실관계를 확인하고 고칠 수 있는 초안을 쓴다.

[이 항목의 작성 기준]
{guidance}{level_note}

[기재 금지 사항 - 학교생활기록부 기재요령]
{common_prohibitions}
{extra_prohibitions}

[서술 원칙]
- 제공된 [학생 활동 기록]에 없는 사실을 만들어내지 말 것(추측·허위 금지).
- 단순 사실을 과장하거나 부풀려서 쓰지 말 것.
- 활동의 단순 나열을 피하고 학생의 개별적 특성이 드러나게 쓸 것.
- 학생 실명·학번 등 식별정보는 출력하지 말 것.
- 분량은 한글 기준 {target_chars}자 안팎으로 쓰되 {target_chars}자를 넘기지 말 것.

[영역/과목] {subject}
[주제] {theme}

[형식(교사가 지정)]
{format}

[예시 글(톤/문장감/구성 참고. 내용은 학생 기록 기반으로 재작성)]
{example}

[학생 활동 기록]
{activity_text}

[교사 추가 키워드(반영)]
{extra_keywords}

[출력]
- 결과 문장만 출력
- 머리말/목차/해설/주의문구 없이 결과만
"#,
        level_name = level_name(level),
        record_name = record_name(level, record),
        guidance = record_guidance(level, record),
        level_note = section("학교급 단서", level_note(level, record)),
        common_prohibitions = COMMON_PROHIBITIONS,
        extra_prohibitions = extra_prohibitions(level, record),
        target_chars = target_chars(project.target_bytes),
        subject = project.subject,
        theme = project.theme,
        format = project.format,
        example = project.example,
        activity_text = student.activity_text,
        extra_keywords = student.extra_keywords,
    )
}

/* 분량만 맞추는 재요청.
새로 쓰라고 하면 교사가 고쳐 둔 표현이 사라지고 기록에 없는 내용이 다시
섞일 수 있다. 그래서 '문장을 다시 쓰라'가 아니라 '있는 내용 안에서 분량만
맞추라'고 지시하고, 금지 사항은 그대로 다시 실어 준다. */
pub(super) fn build_revise_prompt(body: &ReviseRequest) -> String {
    let level = body.school_level;
    let record = body.record_type;
    let current = body.text.chars().count() as i32;
    let direction = if current > body.target_chars {
        "줄여서"
    } else {
        "늘려서"
    };

    format!(
        r#"[역할] {level_name} 학교생활기록부 '{record_name}'에 쓸 아래 문장의 분량만 조정한다.

[규칙]
- 아래 [원문]에 없는 사실을 새로 만들어 내지 말 것.
- 원문이 담은 내용과 판단을 그대로 유지할 것.
- 문장을 {direction} 한글 기준 {target_chars}자 안팎으로 맞추되 {target_chars}자를 넘기지 말 것.
- 늘리는 경우에도 같은 말을 반복하거나 빈 수식어를 덧붙이지 말 것.
- 학생 실명·학번 등 식별정보는 출력하지 말 것.

[기재 금지 사항 - 학교생활기록부 기재요령]
{common_prohibitions}
{extra_prohibitions}

[원문]
{text}

[출력]
- 조정한 문장만 출력
- 머리말/해설/주의문구 없이 결과만
"#,
        level_name = level_name(level),
        record_name = record_name(level, record),
        direction = direction,
        target_chars = body.target_chars.max(1),
        common_prohibitions = COMMON_PROHIBITIONS,
        extra_prohibitions = extra_prohibitions(level, record),
        text = body.text,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{test_project, test_student};

    fn prompt_for(level: SchoolLevel, record: RecordType) -> String {
        let mut project = test_project();
        project.school_level = level;
        project.record_type = record;
        build_prompt(&project, &test_student())
    }

    #[test]
    fn converts_the_byte_target_into_hangul_characters() {
        let prompt = prompt_for(SchoolLevel::High, RecordType::Subject);
        // 1,500Byte = 한글 500자
        assert!(prompt.contains("한글 기준 500자"));
        assert!(!prompt.contains("Byte"));
    }

    #[test]
    fn rounds_the_target_down_so_it_never_exceeds_the_limit() {
        assert_eq!(target_chars(1499), 499);
        assert_eq!(target_chars(1500), 500);
        assert_eq!(target_chars(900), 300);
        // 0으로 나뉘어 '0자'를 지시하지 않는다.
        assert_eq!(target_chars(1), 1);
    }

    #[test]
    fn keeps_project_and_student_values() {
        let prompt = prompt_for(SchoolLevel::High, RecordType::Subject);
        assert!(prompt.contains("[영역/과목] 국어"));
        assert!(prompt.contains("발표: 근거를 제시함"));
        assert!(prompt.contains("질문이 많음"));
    }

    #[test]
    fn every_combination_carries_the_common_prohibitions() {
        let levels = [
            SchoolLevel::Elementary,
            SchoolLevel::Middle,
            SchoolLevel::High,
        ];
        let records = [
            RecordType::Subject,
            RecordType::Autonomy,
            RecordType::Club,
            RecordType::Career,
            RecordType::Behavior,
        ];
        for level in levels {
            for record in records {
                let prompt = prompt_for(level, record);
                assert!(prompt.contains("공인어학시험"), "{level:?} {record:?}");
                assert!(prompt.contains("부모나 친인척의 사회·경제적 지위"));
                assert!(prompt.contains("식별정보는 출력하지 말 것"));
                assert!(prompt.contains("단순 나열"));
            }
        }
    }

    #[test]
    fn names_the_record_by_school_level() {
        assert!(prompt_for(SchoolLevel::Elementary, RecordType::Subject)
            .contains("성취수준 및 특기사항"));
        assert!(prompt_for(SchoolLevel::High, RecordType::Subject)
            .contains("과목별 세부능력 및 특기사항"));
        assert!(prompt_for(SchoolLevel::Elementary, RecordType::Autonomy)
            .contains("자율·자치활동 및 동아리활동"));
    }

    #[test]
    fn subject_scope_differs_between_middle_and_high() {
        assert!(prompt_for(SchoolLevel::High, RecordType::Subject)
            .contains("모든 학생에 대해 입력하는 것이 원칙"));
        assert!(prompt_for(SchoolLevel::Middle, RecordType::Subject)
            .contains("특기할 만한 사항이 있는 과목과 학생"));
    }

    #[test]
    fn only_secondary_subject_records_ban_research_reports() {
        assert!(prompt_for(SchoolLevel::High, RecordType::Subject).contains("연구보고서(소논문)"));
        assert!(prompt_for(SchoolLevel::Middle, RecordType::Subject).contains("연구보고서(소논문)"));
        assert!(!prompt_for(SchoolLevel::Elementary, RecordType::Subject)
            .contains("연구보고서(소논문)"));
    }

    #[test]
    fn behavior_record_focuses_on_growth_not_achievement_standards() {
        let prompt = prompt_for(SchoolLevel::High, RecordType::Behavior);
        assert!(prompt.contains("성장을 지원하는 교육적 관점"));
        assert!(!prompt.contains("성취기준에 따른 성취수준의 특성"));
    }

    #[test]
    fn omits_the_level_note_section_when_there_is_none() {
        assert!(!prompt_for(SchoolLevel::High, RecordType::Club).contains("[학교급 단서]"));
    }
}
