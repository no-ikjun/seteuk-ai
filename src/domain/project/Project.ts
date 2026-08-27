import {
  subjectField,
  writingStyle,
  type RecordType,
  type SchoolLevel,
} from "../record/RecordSpec";
import { defaultTargetBytes } from "../record/NeisBytes";

export type Project = {
  schoolLevel: SchoolLevel;
  recordType: RecordType;
  subject: string;
  theme: string;
  /* 나이스가 받는 Byte 기준 목표 분량. 화면과 프롬프트는 여기서 환산한다. */
  targetBytes: number;
  format: string;
  example: string;
};

export const DEFAULT_PROJECT: Project = {
  schoolLevel: "high",
  recordType: "subject",
  subject: "국어",
  theme: "독서 활동 기반 세특",
  targetBytes: defaultTargetBytes("high", "subject"),
  ...writingStyle("subject"),
};

/* 채워야 하는 칸의 목록. 화면은 이 목록으로 어느 칸이 비었는지 표시하고,
   생성 준비 여부도 같은 기준으로 판단한다. 두 곳이 어긋나면 버튼은 눌리지
   않는데 이유는 보이지 않는 상태가 된다. */
export type ProjectField =
  | "subject"
  | "theme"
  | "targetBytes"
  | "format"
  | "example";

export function missingProjectFields(project: Project): ProjectField[] {
  const missing: ProjectField[] = [];
  /* 행동특성 및 종합의견은 특정 교과나 활동에 매이지 않아 이 칸을 묻지 않는다. */
  if (subjectField(project.recordType) && !project.subject.trim()) {
    missing.push("subject");
  }
  if (!project.theme.trim()) missing.push("theme");
  if (!Number.isFinite(project.targetBytes) || project.targetBytes <= 0) {
    missing.push("targetBytes");
  }
  if (!project.format.trim()) missing.push("format");
  if (!project.example.trim()) missing.push("example");
  return missing;
}

export function isProjectValid(project: Project) {
  return missingProjectFields(project).length === 0;
}
