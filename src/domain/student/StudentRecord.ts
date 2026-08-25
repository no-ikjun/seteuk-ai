export type SourceRow = Record<string, string>;

export type GenerationStatus = "idle" | "generating" | "success" | "failed";

export type StudentRecord = {
  id: string;
  sourceRowIndex: number;
  source: SourceRow;
  extraKeywords: string;
  generatedResult: string;
  result: string;
  selected: boolean;
  status: GenerationStatus;
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

export function getStudentDisplay(
  student: StudentRecord,
  displayKey: string,
) {
  return displayKey
    ? (student.source[displayKey] ?? "").trim() ||
        `#${student.sourceRowIndex + 1}`
    : `#${student.sourceRowIndex + 1}`;
}

export function joinActivity(row: SourceRow, keys: string[]) {
  return keys
    .map((key) => {
      const value = (row[key] ?? "").trim();
      return value ? `${key}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

export function clampText(text: string, max = 6000) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...(이하 생략: 입력이 너무 길어 일부만 전송됨)`;
}
