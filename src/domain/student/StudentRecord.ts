export type SourceRow = Record<string, string>;

export type GenerationStatus = "idle" | "generating" | "success" | "failed";

/* 화면에 보여줄 학생의 진행 단계.
   생성 요청의 결과(GenerationStatus)와 교사의 검토 여부는 서로 다른 축이라
   한 enum에 섞지 않는다. 초안을 다시 생성하면 상태는 generating으로 돌아가고
   검토 여부는 새 초안 기준으로 다시 시작해야 하기 때문이다.
   화면에서 필요한 하나의 값은 이 함수로 합쳐서 만든다. */
export type StudentStage =
  | "idle"
  | "generating"
  | "draft"
  | "reviewed"
  | "failed";

export type StudentRecord = {
  id: string;
  sourceRowIndex: number;
  source: SourceRow;
  extraKeywords: string;
  generatedResult: string;
  result: string;
  selected: boolean;
  status: GenerationStatus;
  /* 교사가 초안을 읽고 확인했는지. 초안이 새로 생성되면 다시 false가 된다. */
  reviewed: boolean;
  retryCount: number;
  error?: string;
};

export type ColumnMapping = {
  displayKey: string;
  activityKeys: string[];
};

const DISPLAY_COLUMN_PATTERN = /이름|성명|학생명|name/i;
const IDENTIFIER_COLUMN_PATTERN =
  /이름|성명|학생명|학번|학생\s*번호|번호|^id$|student.?id|name/i;

export function isIdentifierColumn(column: string) {
  return IDENTIFIER_COLUMN_PATTERN.test(column);
}

export function createStudentRecords(
  rows: SourceRow[],
  sessionId: string,
): StudentRecord[] {
  return rows.map((source, sourceRowIndex) => ({
    id: `${sessionId}:${sourceRowIndex}`,
    sourceRowIndex,
    source,
    extraKeywords: "",
    generatedResult: "",
    result: "",
    selected: true,
    status: "idle",
    reviewed: false,
    retryCount: 0,
  }));
}

export function inferColumnMapping(keys: string[]): ColumnMapping {
  return {
    displayKey:
      keys.find((key) => DISPLAY_COLUMN_PATTERN.test(key)) ?? keys[0] ?? "",
    activityKeys: keys.filter((key) => !isIdentifierColumn(key)),
  };
}

export function getStudentStage(student: StudentRecord): StudentStage {
  if (student.status === "success") {
    return student.reviewed ? "reviewed" : "draft";
  }
  return student.status;
}

export function getStudentDisplay(
  student: StudentRecord,
  displayKey: string,
) {
  return displayKey
    ? (student.source[displayKey] ?? "").trim() ||
        `#${student.sourceRowIndex + 1}`
    : `#${student.sourceRowIndex + 1}`;
}

export type ActivityEntry = { key: string; value: string };

/* 화면에 읽기 좋게 보여줄 때와 모델에 보낼 때가 어긋나면 안 된다.
   joinActivity를 이 함수 위에 정의해 두 표현이 같은 값에서 나오게 한다. */
export function activityEntries(
  row: SourceRow,
  keys: string[],
): ActivityEntry[] {
  return keys
    .map((key) => ({ key, value: (row[key] ?? "").trim() }))
    .filter((entry) => entry.value.length > 0);
}

export function joinActivity(row: SourceRow, keys: string[]) {
  return activityEntries(row, keys)
    .map((entry) => `${entry.key}: ${entry.value}`)
    .join("\n");
}

export function clampText(text: string, max = 6000) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...(이하 생략: 입력이 너무 길어 일부만 전송됨)`;
}
