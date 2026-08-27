import type { RecordType, SchoolLevel } from "../record/RecordSpec";

export type ComplianceFinding = {
  ruleId: string;
  label: string;
  matched: string;
  hint: string;
};

type ComplianceRule = {
  id: string;
  label: string;
  pattern: RegExp;
  hint: string;
  /* 비워 두면 모든 항목에 적용한다. */
  records?: RecordType[];
  levels?: SchoolLevel[];
};

/* 프롬프트로 금지 사항을 알려도 모델이 놓칠 수 있다. 결과를 PC 안에서 한 번 더
   훑어 기재요령이 금지한 표현을 찾아낸다. 외부로 나가는 요청이 없으므로
   개인정보가 더 노출되지 않고, 프롬프트보다 확실하게 걸러진다.

   여기서 잡히는 것은 '반드시 지워야 할 위반'이 아니라 '교사가 확인할 자리'다.
   판단은 교사가 한다. */
const RULES: ComplianceRule[] = [
  {
    id: "language-test",
    label: "공인어학시험",
    pattern:
      /TOEIC|TOEFL|TEPS|HSK|JPT|JLPT|DELF|DALF|TESTDAF|TORFL|DELE|토익|토플|텝스|한자능력검정|한자자격검정/gi,
    hint: "공인어학시험 참여 사실과 성적은 어떤 항목에도 쓸 수 없습니다.",
  },
  {
    id: "contest",
    label: "대회·수상",
    pattern:
      /대회|수상|최우수상|우수상|장려상|금상|은상|동상|입상|표창장|감사장|공로상/g,
    hint: "교내외 대회 참여 사실과 수상 실적은 쓸 수 없습니다.",
  },
  {
    id: "certification-exam",
    label: "인증시험",
    pattern: /인증시험|검정시험|능력검정/g,
    hint: "교내외 인증시험 참여 사실이나 성적은 쓸 수 없습니다.",
  },
  {
    id: "paper",
    label: "논문·학회",
    pattern: /논문|소논문|학회|학술지|투고|등재/g,
    hint: "논문 투고·등재·학회 발표 사실은 쓸 수 없습니다.",
  },
  {
    id: "book",
    label: "도서 출간",
    pattern: /출간|출판|저서/g,
    hint: "도서 출간 사실은 쓸 수 없습니다.",
  },
  {
    id: "ip",
    label: "지식재산권",
    pattern: /특허|실용신안|상표 ?출원|디자인 ?등록|지식재산권/g,
    hint: "지식재산권 출원·등록 사실은 쓸 수 없습니다.",
  },
  {
    id: "overseas",
    label: "해외 활동",
    pattern: /어학연수|해외연수|해외봉사|해외 봉사|교환학생/g,
    hint: "어학연수 등 해외 활동실적은 쓸 수 없습니다.",
  },
  {
    id: "scholarship",
    label: "장학금",
    pattern: /장학생|장학금/g,
    hint: "장학생·장학금 관련 내용은 쓸 수 없습니다.",
  },
  {
    id: "university",
    label: "대학·기관명",
    pattern: /[가-힣A-Za-z]{2,}(?:대학교|대학원)/g,
    hint: "구체적인 대학명과 기관명은 쓸 수 없습니다.",
  },
  {
    id: "school-name",
    label: "학교명",
    pattern: /[가-힣]{2,}(?:초등학교|중학교|고등학교)/g,
    hint: "학생이 재학한 학교를 알 수 있는 내용은 쓸 수 없습니다.",
  },
  {
    id: "license",
    label: "자격증",
    pattern: /자격증|자격 ?취득|기능사|기사 ?자격/g,
    hint: "자격증 명칭과 취득 사실은 '자격증 취득상황' 밖에는 쓸 수 없습니다.",
  },
  {
    id: "mock-exam",
    label: "모의고사·성적",
    pattern: /모의고사|전국연합학력평가|학력평가|백분위|석차등급/g,
    hint: "모의고사·학력평가 성적 관련 내용은 쓸 수 없습니다.",
  },
  {
    id: "mooc",
    label: "MOOC",
    pattern: /K-MOOC|MOOC|KOCW/gi,
    hint: "K-MOOC 등 관련 사항은 쓸 수 없습니다.",
    records: ["subject"],
  },
  {
    id: "after-school",
    label: "방과후학교",
    pattern: /방과후학교|방과 후 학교/g,
    hint: "방과후학교 활동은 쓸 수 없습니다.",
  },
];

/* 부모의 사회·경제적 지위는 단어 하나로는 판단할 수 없다. 가족을 가리키는 말과
   지위를 가리키는 말이 한 문장 안에 같이 나올 때만 확인 대상으로 본다. */
const FAMILY_PATTERN = /부모|아버지|어머니|아빠|엄마|부친|모친|친인척|가족/;
const STATUS_PATTERN =
  /직업|직장|회사|사업|근무|의사|변호사|교수|공무원|사장|대표|판사|검사|약사|회계사|경영/;

function findFamilyStatus(text: string): ComplianceFinding[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter(
      (sentence) =>
        FAMILY_PATTERN.test(sentence) && STATUS_PATTERN.test(sentence),
    )
    .map((sentence) => ({
      ruleId: "family-status",
      label: "부모 사회·경제적 지위",
      matched: sentence.trim(),
      hint: "부모나 친인척의 직업·직장을 암시하는 내용은 쓸 수 없습니다.",
    }));
}

function appliesTo(
  rule: ComplianceRule,
  level: SchoolLevel,
  record: RecordType,
) {
  if (rule.records && !rule.records.includes(record)) return false;
  if (rule.levels && !rule.levels.includes(level)) return false;
  return true;
}

function uniqueMatches(text: string, pattern: RegExp) {
  /* 원본 정규식의 lastIndex를 건드리지 않도록 매번 새로 만든다. */
  const scoped = new RegExp(pattern.source, pattern.flags);
  return [...new Set(text.match(scoped) ?? [])];
}

export function checkCompliance(
  text: string,
  level: SchoolLevel,
  record: RecordType,
): ComplianceFinding[] {
  const target = text.trim();
  if (!target) return [];

  const findings = RULES.filter((rule) => appliesTo(rule, level, record)).flatMap(
    (rule) =>
      uniqueMatches(target, rule.pattern).map((matched) => ({
        ruleId: rule.id,
        label: rule.label,
        matched,
        hint: rule.hint,
      })),
  );

  return [...findings, ...findFamilyStatus(target)];
}
