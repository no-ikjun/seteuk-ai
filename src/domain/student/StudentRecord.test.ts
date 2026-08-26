import { describe, expect, it } from "vitest";
import {
  activityEntries,
  clampText,
  createStudentRecords,
  getStudentStage,
  inferColumnMapping,
  joinActivity,
  type StudentRecord,
} from "./StudentRecord";

describe("StudentRecord", () => {
  it("생성 결과와 검토 여부를 합쳐 화면 단계를 만든다", () => {
    const [student] = createStudentRecords([{ 이름: "홍길동" }], "session-a");
    const withStage = (patch: Partial<StudentRecord>) =>
      getStudentStage({ ...student, ...patch });

    expect(withStage({})).toBe("idle");
    expect(withStage({ status: "generating" })).toBe("generating");
    expect(withStage({ status: "failed" })).toBe("failed");
    // 같은 success라도 검토 여부에 따라 단계가 갈린다.
    expect(withStage({ status: "success", reviewed: false })).toBe("draft");
    expect(withStage({ status: "success", reviewed: true })).toBe("reviewed");
  });


  it("화면에 보여줄 활동 항목과 전송 문자열이 같은 값에서 나온다", () => {
    const row = {
      이름: "홍길동",
      활동1: " 수학 발표 주도 ",
      활동2: "",
      활동3: "보고서 작성",
    };
    const keys = ["활동1", "활동2", "활동3"];

    expect(activityEntries(row, keys)).toEqual([
      { key: "활동1", value: "수학 발표 주도" },
      { key: "활동3", value: "보고서 작성" },
    ]);

    // 값이 빈 컬럼은 양쪽 모두에서 빠진다.
    expect(joinActivity(row, keys)).toBe(
      activityEntries(row, keys)
        .map((entry) => `${entry.key}: ${entry.value}`)
        .join("\n"),
    );
  });
  it("세션과 원본 행 번호로 안정적인 학생 ID를 만든다", () => {
    const students = createStudentRecords(
      [{ 이름: "홍길동" }, { 이름: "김영희" }],
      "session-a",
    );

    expect(students.map((student) => student.id)).toEqual([
      "session-a:0",
      "session-a:1",
    ]);
    expect(students.every((student) => student.status === "idle")).toBe(true);
  });

  it("식별정보는 기본 활동 컬럼에서 제외한다", () => {
    expect(
      inferColumnMapping(["학번", "학생명", "독서 기록", "발표 내용"]),
    ).toEqual({
      displayKey: "학생명",
      activityKeys: ["독서 기록", "발표 내용"],
    });
  });

  it("식별정보 컬럼밖에 없으면 활동 컬럼을 자동 선택하지 않는다", () => {
    expect(inferColumnMapping(["이름", "학번", "ID"])).toEqual({
      displayKey: "이름",
      activityKeys: [],
    });
  });

  it("값이 있는 활동만 컬럼명과 함께 합친다", () => {
    expect(
      joinActivity(
        { 이름: "홍길동", 발표: "근거를 들어 설명함", 토론: "  " },
        ["발표", "토론"],
      ),
    ).toBe("발표: 근거를 들어 설명함");
  });

  it("너무 긴 활동 텍스트를 제한하고 안내 문구를 붙인다", () => {
    expect(clampText("1234", 4)).toBe("1234");
    expect(clampText("12345", 4)).toContain("1234\n...(이하 생략");
  });
});
