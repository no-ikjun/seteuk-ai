import { describe, expect, it } from "vitest";
import { clampText, inferColumnMapping, joinActivity } from "./studentData";

describe("inferColumnMapping", () => {
  it("이름 계열 컬럼은 표시용으로 선택하고 식별정보는 활동에서 제외한다", () => {
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

  it("빈 컬럼 목록을 안전하게 처리한다", () => {
    expect(inferColumnMapping([])).toEqual({
      displayKey: "",
      activityKeys: [],
    });
  });
});

describe("joinActivity", () => {
  it("값이 있는 선택 컬럼만 컬럼명과 함께 합친다", () => {
    expect(
      joinActivity(
        { 이름: "홍길동", 발표: "근거를 들어 설명함", 토론: "  " },
        ["발표", "토론"],
      ),
    ).toBe("발표: 근거를 들어 설명함");
  });
});

describe("clampText", () => {
  it("제한 이내의 문자열은 그대로 반환한다", () => {
    expect(clampText("1234", 4)).toBe("1234");
  });

  it("제한을 넘는 문자열을 자르고 안내 문구를 붙인다", () => {
    const result = clampText("12345", 4);
    expect(result.startsWith("1234\n")).toBe(true);
    expect(result).toContain("이하 생략");
  });
});
