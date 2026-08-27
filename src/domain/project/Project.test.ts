import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT,
  isProjectValid,
  missingProjectFields,
  type Project,
} from "./Project";

const project = (patch: Partial<Project> = {}): Project => ({
  ...DEFAULT_PROJECT,
  ...patch,
});

describe("missingProjectFields", () => {
  it("기본값은 바로 생성할 수 있다", () => {
    expect(missingProjectFields(DEFAULT_PROJECT)).toEqual([]);
    expect(isProjectValid(DEFAULT_PROJECT)).toBe(true);
  });

  it("비어 있는 칸을 모두 알린다", () => {
    const missing = missingProjectFields(
      project({ subject: "", theme: "  ", format: "", example: "" }),
    );
    expect(missing).toEqual(["subject", "theme", "format", "example"]);
  });

  it("행동특성 및 종합의견은 과목을 묻지 않는다", () => {
    const behavior = project({ recordType: "behavior", subject: "" });
    expect(missingProjectFields(behavior)).toEqual([]);
    expect(isProjectValid(behavior)).toBe(true);
  });

  it("교과 항목은 과목이 비면 생성할 수 없다", () => {
    const subject = project({ recordType: "subject", subject: "" });
    expect(missingProjectFields(subject)).toContain("subject");
    expect(isProjectValid(subject)).toBe(false);
  });

  it("목표 분량은 0보다 커야 한다", () => {
    expect(missingProjectFields(project({ targetBytes: 0 }))).toContain("targetBytes");
    expect(missingProjectFields(project({ targetBytes: Number.NaN }))).toContain(
      "targetBytes",
    );
    expect(missingProjectFields(project({ targetBytes: 1 }))).not.toContain(
      "targetBytes",
    );
  });
});
