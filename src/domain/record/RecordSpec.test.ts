import { describe, expect, it } from "vitest";
import {
  coerceRecordType,
  isRecordAvailable,
  recordLabel,
  recordOptions,
  SCHOOL_LEVELS,
  subjectField,
  writingStyle,
  type RecordType,
} from "./RecordSpec";

describe("recordOptions", () => {
  it("초등학교는 동아리활동을 따로 고르지 않는다", () => {
    const values = recordOptions("elementary").map((item) => item.value);
    expect(values).not.toContain("club");
    expect(values).toContain("autonomy");
  });

  it("중·고등학교는 창의적 체험활동 세 영역을 모두 고른다", () => {
    for (const level of ["middle", "high"] as const) {
      const values = recordOptions(level).map((item) => item.value);
      expect(values).toContain("autonomy");
      expect(values).toContain("club");
      expect(values).toContain("career");
    }
  });

  it("모든 학교급에서 교과와 행동특성을 고를 수 있다", () => {
    for (const { value } of SCHOOL_LEVELS) {
      const values = recordOptions(value).map((item) => item.value);
      expect(values).toContain("subject");
      expect(values).toContain("behavior");
    }
  });
});

describe("recordLabel", () => {
  it("초등학교 교과 항목은 이름이 다르다", () => {
    expect(recordLabel("elementary", "subject")).toBe("성취수준 및 특기사항");
    expect(recordLabel("high", "subject")).toBe("교과 세부능력 및 특기사항");
  });

  it("초등학교 자율·자치활동은 동아리활동과 통합해 부른다", () => {
    expect(recordLabel("elementary", "autonomy")).toBe(
      "자율·자치활동·동아리활동",
    );
  });

  it("그 학교급에 없는 항목은 빈 문자열이다", () => {
    expect(recordLabel("elementary", "club")).toBe("");
  });
});

describe("coerceRecordType", () => {
  it("초등학교로 옮기면 동아리활동을 자율·자치활동으로 합친다", () => {
    expect(coerceRecordType("elementary", "club")).toBe("autonomy");
  });

  it("쓸 수 있는 항목은 그대로 둔다", () => {
    const records: RecordType[] = ["subject", "autonomy", "career", "behavior"];
    for (const record of records) {
      expect(coerceRecordType("elementary", record)).toBe(record);
      expect(coerceRecordType("high", record)).toBe(record);
    }
    expect(coerceRecordType("high", "club")).toBe("club");
  });

  it("옮긴 결과는 언제나 그 학교급에서 쓸 수 있다", () => {
    const records: RecordType[] = [
      "subject",
      "autonomy",
      "club",
      "career",
      "behavior",
    ];
    for (const { value: level } of SCHOOL_LEVELS) {
      for (const record of records) {
        expect(isRecordAvailable(level, coerceRecordType(level, record))).toBe(
          true,
        );
      }
    }
  });
});

describe("subjectField / writingStyle", () => {
  it("행동특성 및 종합의견은 과목 칸을 두지 않는다", () => {
    expect(subjectField("behavior")).toBeNull();
  });

  it("나머지 항목은 저마다 다른 이름으로 묻는다", () => {
    const labels = (["subject", "autonomy", "club", "career"] as const).map(
      (record) => subjectField(record)?.label,
    );
    expect(labels).toEqual(["과목", "활동 영역", "동아리", "진로 영역"]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("모든 항목에 기본 문체가 있다", () => {
    const records: RecordType[] = [
      "subject",
      "autonomy",
      "club",
      "career",
      "behavior",
    ];
    for (const record of records) {
      const style = writingStyle(record);
      expect(style.format.trim()).not.toBe("");
      expect(style.example.trim()).not.toBe("");
    }
  });

  it("항목마다 기본 문체가 다르다", () => {
    const formats = (
      ["subject", "autonomy", "club", "career", "behavior"] as const
    ).map((record) => writingStyle(record).format);
    expect(new Set(formats).size).toBe(formats.length);
  });
});
