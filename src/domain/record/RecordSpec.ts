export type SchoolLevel = "elementary" | "middle" | "high";

/* 학교생활기록부에서 이 앱이 초안을 쓰는 서술형 항목.
   항목마다 기재요령이 요구하는 서술의 초점과 금지 사항이 달라, 화면에서
   무엇을 쓰는지 먼저 고르게 한다. */
export type RecordType =
  | "subject"
  | "autonomy"
  | "club"
  | "career"
  | "behavior";

export const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "elementary", label: "초등학교" },
  { value: "middle", label: "중학교" },
  { value: "high", label: "고등학교" },
];

export type RecordOption = {
  value: RecordType;
  label: string;
  hint: string;
};

/* 초등학교는 교과 항목의 이름이 다르고, 자율·자치활동과 동아리활동 특기사항을
   통합해 입력하므로 동아리활동을 따로 고르지 않는다. */
const ELEMENTARY_OPTIONS: RecordOption[] = [
  {
    value: "subject",
    label: "성취수준 및 특기사항",
    hint: "교과별 성취기준에 따른 성취수준의 특성을 씁니다.",
  },
  {
    value: "autonomy",
    label: "자율·자치활동·동아리활동",
    hint: "초등학교는 두 영역의 특기사항을 통합해 입력합니다.",
  },
  {
    value: "career",
    label: "진로활동",
    hint: "진로 특성이 드러나는 사항을 씁니다.",
  },
  {
    value: "behavior",
    label: "행동특성 및 종합의견",
    hint: "학년 동안 관찰한 행동특성을 종합합니다.",
  },
];

const SECONDARY_OPTIONS: RecordOption[] = [
  {
    value: "subject",
    label: "교과 세부능력 및 특기사항",
    hint: "성취기준에 따른 성취수준의 특성과 학습활동 참여도를 씁니다.",
  },
  {
    value: "autonomy",
    label: "자율·자치활동",
    hint: "활동 과정에서 드러난 역할과 참여도를 씁니다.",
  },
  {
    value: "club",
    label: "동아리활동",
    hint: "실제로 한 활동과 역할을 씁니다.",
  },
  {
    value: "career",
    label: "진로활동",
    hint: "진로희망과 관련된 노력과 활동을 씁니다.",
  },
  {
    value: "behavior",
    label: "행동특성 및 종합의견",
    hint: "학년 동안 관찰한 행동특성을 종합합니다.",
  },
];

export function recordOptions(level: SchoolLevel): RecordOption[] {
  return level === "elementary" ? ELEMENTARY_OPTIONS : SECONDARY_OPTIONS;
}

export function recordLabel(level: SchoolLevel, record: RecordType) {
  const option = recordOptions(level).find((item) => item.value === record);
  return option?.label ?? "";
}

export function isRecordAvailable(level: SchoolLevel, record: RecordType) {
  return recordOptions(level).some((item) => item.value === record);
}

/* 학교급을 바꾸면 지금 고른 항목이 그 학교급에 없을 수 있다.
   (예: 고등학교 동아리활동 → 초등학교) 이때 조용히 빈 값으로 두지 않는다. */
export function coerceRecordType(
  level: SchoolLevel,
  record: RecordType,
): RecordType {
  if (isRecordAvailable(level, record)) return record;
  /* 동아리활동은 초등학교에서 자율·자치활동과 통합되므로 그쪽으로 옮긴다. */
  if (record === "club") return "autonomy";
  return recordOptions(level)[0].value;
}

export type SubjectField = {
  label: string;
  placeholder: string;
  hint: string;
};

/* '과목/영역' 칸은 항목마다 묻는 것이 다르다. 행동특성 및 종합의견은 특정
   교과나 활동에 매이지 않으므로 아예 묻지 않는다. */
const SUBJECT_FIELDS: Record<RecordType, SubjectField | null> = {
  subject: {
    label: "과목",
    placeholder: "예: 국어, 화학Ⅰ, 통합사회",
    hint: "세부능력 및 특기사항을 쓸 과목 이름입니다.",
  },
  autonomy: {
    label: "활동 영역",
    placeholder: "예: 학급 자치활동, 학교 자율 프로그램",
    hint: "자율·자치활동에서 어떤 활동을 다루는지 적습니다.",
  },
  club: {
    label: "동아리",
    placeholder: "예: 과학탐구반, 영어회화반",
    hint: "동아리 이름은 결과 문장에 그대로 쓰이지 않습니다.",
  },
  career: {
    label: "진로 영역",
    placeholder: "예: 진로 탐색, 진로 상담",
    hint: "진로활동에서 어떤 활동을 다루는지 적습니다.",
  },
  behavior: null,
};

export function subjectField(record: RecordType) {
  return SUBJECT_FIELDS[record];
}

export type WritingStyle = { format: string; example: string };

/* 항목별 기본 문체. 빈 칸에서 시작하면 무엇을 적어야 할지 알 수 없어,
   한 번 눌러 채운 뒤 고쳐 쓰도록 한다. 내용이 아니라 문장의 결을 정하는
   값이므로 학생 기록과 무관하다. */
const WRITING_STYLES: Record<RecordType, WritingStyle> = {
  subject: {
    format:
      "교사 관찰자 시점(3인칭). 성취기준에 비춘 이해 수준, 수업 참여 태도, 학기 중 변화와 성장을 담는다. 구체적 근거를 1~2개 포함하고 과장하지 않는다. 문장 3~5개.",
    example:
      "수업에서 다룬 핵심 개념을 자신의 말로 재구성해 설명하며 이해를 넓혀 감. 자료를 근거로 의견을 세우고, 토의 과정에서 다른 관점을 들은 뒤 논지를 보완함. 학기 후반에는 스스로 질문을 만들어 탐구를 이어 가는 모습을 보임.",
  },
  autonomy: {
    format:
      "교사 관찰자 시점(3인칭). 활동 결과보다 과정에서 드러난 역할, 참여도, 협력하는 태도를 담는다. 학생이 실제로 맡은 일을 구체적으로 쓴다. 문장 3~4개.",
    example:
      "학급 회의에서 논의가 겉돌 때 쟁점을 정리해 제안하며 결정을 도움. 맡은 역할을 끝까지 책임지고, 의견이 다른 친구의 말을 먼저 듣고 조율하는 태도를 보임.",
  },
  club: {
    format:
      "교사 관찰자 시점(3인칭). 참여도, 협력도, 열성도와 실제로 맡은 활동과 역할을 담는다. 동아리 이름 자체보다 학생이 한 일을 쓴다. 문장 3~4개.",
    example:
      "정기 활동에 꾸준히 참여하며 준비 과정에서 필요한 자료를 스스로 찾아 정리함. 다른 부원과 역할을 나눠 진행하고, 어려운 단계에서는 방법을 바꿔 다시 시도하는 끈기를 보임.",
  },
  career: {
    format:
      "교사 관찰자 시점(3인칭). 진로희망과 관련해 학생이 보인 자질, 스스로 한 노력과 활동, 태도의 변화를 담는다. 문장 3~4개.",
    example:
      "관심 분야를 알아보기 위해 관련 자료를 찾아 읽고 궁금한 점을 정리해 상담에 가져옴. 탐색 초기에는 막연해하였으나 활동을 거치며 무엇을 더 준비해야 하는지 스스로 정리하게 됨.",
  },
  behavior: {
    format:
      "학급담임 관찰자 시점(3인칭). 학년 동안 지속적으로 관찰한 학습·행동·인성 전반을 종합한다. 성장 정도와 발전 가능성을 학생의 성장을 지원하는 관점에서 쓴다. 문장 3~5개.",
    example:
      "맡은 일을 미루지 않고 끝내며, 주변을 살펴 도움이 필요한 친구에게 먼저 다가감. 학기 초에는 자기 의견을 드러내는 데 조심스러웠으나 점차 근거를 들어 생각을 말하게 됨. 꾸준함이 강점이어서 관심 분야에서 더 깊이 나아갈 힘이 있음.",
  },
};

export function writingStyle(record: RecordType) {
  return WRITING_STYLES[record];
}
