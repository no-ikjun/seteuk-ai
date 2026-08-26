import {
  getStudentStage,
  type StudentRecord,
  type StudentStage,
} from "../../domain/student/StudentRecord";

/* 목록 필터. 진행 단계와 같은 값을 쓰고 `전체`만 더한다. */
export type StudentFilter = StudentStage | "all";

export const STAGE_LABEL: Record<StudentStage, string> = {
  idle: "미생성",
  generating: "생성 중",
  draft: "초안",
  reviewed: "검토 완료",
  failed: "실패",
};

export function matchesFilter(student: StudentRecord, filter: StudentFilter) {
  return filter === "all" || getStudentStage(student) === filter;
}

export function countByStage(students: StudentRecord[]) {
  const counts: Record<StudentStage, number> = {
    idle: 0,
    generating: 0,
    draft: 0,
    reviewed: 0,
    failed: 0,
  };
  for (const student of students) counts[getStudentStage(student)] += 1;
  return counts;
}
