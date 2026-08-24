import type { Row } from "./parseSheet";

export type ColumnMapping = {
  displayKey: string;
  activityKeys: string[];
};

const DISPLAY_COLUMN_PATTERN = /이름|성명|학생명|name/i;
const IDENTIFIER_COLUMN_PATTERN =
  /이름|성명|학생명|학번|학생\s*번호|번호|^id$|student.?id|name/i;

export function inferColumnMapping(keys: string[]): ColumnMapping {
  const displayKey =
    keys.find((key) => DISPLAY_COLUMN_PATTERN.test(key)) ?? keys[0] ?? "";
  const activityKeys = keys.filter(
    (key) => !IDENTIFIER_COLUMN_PATTERN.test(key),
  );

  return {
    displayKey,
    activityKeys,
  };
}

export function joinActivity(row: Row, keys: string[]) {
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
