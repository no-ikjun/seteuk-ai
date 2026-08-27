import { describe, expect, it } from "vitest";
import {
  byteStatus,
  defaultTargetBytes,
  hangulCharsFor,
  neisByteLength,
  recordByteLimit,
} from "./NeisBytes";

describe("neisByteLength", () => {
  it("기재요령이 밝힌 세 기준값을 그대로 만든다", () => {
    expect(neisByteLength("가")).toBe(3);
    expect(neisByteLength("a")).toBe(1);
    expect(neisByteLength("7")).toBe(1);
    expect(neisByteLength("\n")).toBe(1);
  });

  it("섞여 있어도 더한 값과 같다", () => {
    // 한글 2자(6) + 공백(1) + 영문 3자(3) + 숫자 1자(1)
    expect(neisByteLength("학생 abc1")).toBe(11);
  });

  it("빈 문자열은 0이다", () => {
    expect(neisByteLength("")).toBe(0);
  });

  it("CRLF도 엔터 하나로 센다", () => {
    expect(neisByteLength("가\r\n나")).toBe(7);
    expect(neisByteLength("가\n나")).toBe(7);
  });

  it("한글 500자는 1,500Byte다", () => {
    expect(neisByteLength("가".repeat(500))).toBe(1500);
  });
});

describe("recordByteLimit", () => {
  it("중·고등학교 세특과 창의적 체험활동은 500자(1,500Byte)다", () => {
    for (const level of ["middle", "high"] as const) {
      for (const record of ["subject", "autonomy", "club", "career"] as const) {
        expect(recordByteLimit(level, record)).toBe(1500);
      }
    }
  });

  it("행동특성 및 종합의견은 300자(900Byte)다", () => {
    expect(recordByteLimit("high", "behavior")).toBe(900);
    expect(recordByteLimit("middle", "behavior")).toBe(900);
  });

  it("초등학교는 제한이 없다", () => {
    for (const record of ["subject", "autonomy", "career", "behavior"] as const) {
      expect(recordByteLimit("elementary", record)).toBeNull();
    }
  });
});

describe("hangulCharsFor", () => {
  it("Byte를 한글 기준 글자 수로 바꾼다", () => {
    expect(hangulCharsFor(1500)).toBe(500);
    expect(hangulCharsFor(900)).toBe(300);
  });

  it("나머지는 버려서 한도를 넘기지 않는다", () => {
    expect(hangulCharsFor(1499)).toBe(499);
  });
});

describe("defaultTargetBytes", () => {
  it("한도가 있으면 한도를 목표로 삼는다", () => {
    expect(defaultTargetBytes("high", "subject")).toBe(1500);
    expect(defaultTargetBytes("high", "behavior")).toBe(900);
  });

  it("제한이 없는 초등학교도 목표는 둔다", () => {
    expect(defaultTargetBytes("elementary", "subject")).toBe(1500);
  });
});

describe("byteStatus", () => {
  it("한도를 넘으면 over다", () => {
    expect(byteStatus(1501, 1500)).toBe("over");
  });

  it("한도의 90%부터 near다", () => {
    expect(byteStatus(1350, 1500)).toBe("near");
    expect(byteStatus(1349, 1500)).toBe("ok");
    expect(byteStatus(1500, 1500)).toBe("near");
  });

  it("빈 결과와 제한 없는 항목은 경고하지 않는다", () => {
    expect(byteStatus(0, 1500)).toBe("empty");
    expect(byteStatus(999999, null)).toBe("ok");
  });
});
