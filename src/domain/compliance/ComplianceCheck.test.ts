import { describe, expect, it } from "vitest";
import type {
  RecordType,
  SchoolLevel,
} from "../record/RecordSpec";
import { checkCompliance } from "./ComplianceCheck";

const ids = (
  text: string,
  level: SchoolLevel = "high",
  record: RecordType = "subject",
) => checkCompliance(text, level, record).map((finding) => finding.ruleId);

describe("checkCompliance", () => {
  it("빈 결과는 검사하지 않는다", () => {
    expect(checkCompliance("   ", "high", "subject")).toEqual([]);
  });

  it("기재요령을 지킨 문장은 아무것도 잡지 않는다", () => {
    const text =
      "수업에서 다룬 개념을 스스로 재구성하여 설명하였고, 토의 과정에서 근거를 들어 의견을 정리하며 사고를 넓혀 감.";
    expect(checkCompliance(text, "high", "subject")).toEqual([]);
  });

  it("공인어학시험 이름을 잡는다", () => {
    expect(ids("TOEIC 성적이 향상됨.")).toContain("language-test");
    expect(ids("토익 점수를 언급함.")).toContain("language-test");
  });

  it("대회와 수상 표현을 잡는다", () => {
    expect(ids("교내 토론대회에서 최우수상을 받음.")).toContain("contest");
  });

  it("논문과 학회 표현을 잡는다", () => {
    expect(ids("탐구 결과를 소논문으로 정리함.")).toContain("paper");
  });

  it("지식재산권과 도서 출간을 잡는다", () => {
    expect(ids("아이디어를 특허 출원함.")).toContain("ip");
    expect(ids("활동 결과를 책으로 출간함.")).toContain("book");
  });

  it("대학명과 학교명을 잡는다", () => {
    expect(ids("서울대학교 연구실을 방문함.")).toContain("university");
    expect(ids("한빛고등학교 축제에서 발표함.")).toContain("school-name");
  });

  it("장학금과 자격증을 잡는다", () => {
    expect(ids("교내 장학생으로 선발됨.")).toContain("scholarship");
    expect(ids("정보처리기능사 자격증을 취득함.")).toContain("license");
  });

  it("모의고사 성적을 잡는다", () => {
    expect(ids("모의고사 백분위가 상승함.")).toContain("mock-exam");
  });

  it("같은 표현이 여러 번 나와도 한 번만 알린다", () => {
    const findings = checkCompliance(
      "대회에 참가함. 다른 대회에도 참가함.",
      "high",
      "subject",
    );
    expect(findings.filter((finding) => finding.ruleId === "contest")).toHaveLength(1);
  });

  it("MOOC는 교과 항목에서만 확인한다", () => {
    expect(ids("K-MOOC 강좌를 수강함.", "high", "subject")).toContain("mooc");
    expect(ids("K-MOOC 강좌를 수강함.", "high", "career")).not.toContain("mooc");
  });
});

describe("부모의 사회·경제적 지위", () => {
  it("가족과 지위가 한 문장에 같이 나올 때만 잡는다", () => {
    expect(ids("아버지의 직업을 따라 진로를 정함.")).toContain("family-status");
  });

  it("가족만 나오면 잡지 않는다", () => {
    expect(ids("가족과 함께 봉사에 참여함.")).not.toContain("family-status");
  });

  it("지위를 뜻하는 말만 나오면 잡지 않는다", () => {
    expect(ids("의사가 되고 싶다는 진로희망을 밝힘.")).not.toContain(
      "family-status",
    );
  });

  it("문장이 다르면 잡지 않는다", () => {
    expect(
      ids("어머니와 대화를 나눔. 장래에 교수가 되고 싶다고 함."),
    ).not.toContain("family-status");
  });
});
