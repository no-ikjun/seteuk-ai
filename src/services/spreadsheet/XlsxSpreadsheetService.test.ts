import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { createStudentRecords } from "../../domain/student/StudentRecord";
import {
  buildResultsWorkbook,
  buildStarterWorkbook,
  XlsxSpreadsheetExporter,
  XlsxSpreadsheetReader,
} from "./XlsxSpreadsheetService";

function workbookFile() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { 이름: " 홍길동 ", 활동: " 토론 참여 " },
      { 이름: "김영희", 활동: "발표" },
    ]),
    "학생",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ 무시: "두 번째 시트" }]),
    "기타",
  );
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new File([bytes], "students.xlsx");
}

describe("XlsxSpreadsheetReader", () => {
  it("첫 번째 워크시트만 읽고 값을 정리된 문자열로 반환한다", async () => {
    const reader = new XlsxSpreadsheetReader();
    await expect(reader.read(workbookFile())).resolves.toEqual([
      { 이름: "홍길동", 활동: "토론 참여" },
      { 이름: "김영희", 활동: "발표" },
    ]);
  });

  it("UTF-8 한글 CSV의 컬럼명과 값을 깨뜨리지 않는다", async () => {
    const reader = new XlsxSpreadsheetReader();
    const csv = new File(
      ["이름,학번,활동\n홍길동,1001,토론에서 근거를 제시함"],
      "학생 활동.csv",
      { type: "text/csv;charset=utf-8" },
    );

    await expect(reader.read(csv)).resolves.toEqual([
      { 이름: "홍길동", 학번: "1001", 활동: "토론에서 근거를 제시함" },
    ]);
  });

  it("2,000명 규모의 한글 엑셀을 누락 없이 읽는다", async () => {
    const rows = Array.from({ length: 2_000 }, (_, index) => ({
      이름: `학생${index + 1}`,
      학번: `S${String(index + 1).padStart(4, "0")}`,
      활동: `탐구 활동 ${index + 1}에서 근거를 정리하고 의견을 발표함`,
      관찰: "동료의 의견을 경청하고 피드백을 반영함",
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "학생활동",
    );
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new File([bytes], "대용량 학생활동.xlsx");

    const parsed = await new XlsxSpreadsheetReader().read(file);

    expect(parsed).toHaveLength(2_000);
    expect(parsed[0]).toEqual(rows[0]);
    expect(parsed[1_999]).toEqual(rows[1_999]);
  });
});

describe("buildResultsWorkbook", () => {
  it("학생 배열 순서와 무관하게 원본 행 순서로 결과를 내보낸다", () => {
    const students = createStudentRecords(
      [
        { 이름: "홍길동", 활동: "토론" },
        { 이름: "김영희", 활동: "발표" },
      ],
      "session",
    );
    students[0] = {
      ...students[0]!,
      extraKeywords: "질문이 많음",
      result: "첫 번째 세특",
      generatedResult: "AI가 만든 첫 번째 세특",
      status: "success",
    };

    const { workbook, outputFileName } = buildResultsWorkbook({
      students: [...students].reverse(),
      fileName: "학생 활동.xlsx",
      mapping: { displayKey: "이름", activityKeys: ["활동"] },
      project: {
        schoolLevel: "high",
        recordType: "subject",
        subject: "국어",
        theme: "독서 활동",
        targetBytes: 1500,
        format: "교사 관찰자 시점",
        example: "예시 문장",
      },
    });

    expect(outputFileName).toBe("학생 활동_seeteuk_results.xlsx");
    expect(workbook.SheetNames).toEqual(["results", "project_meta"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.results)).toEqual([
      {
        index: 1,
        display: "홍길동",
        extra_keywords: "질문이 많음",
        result: "첫 번째 세특",
      },
      { index: 2, display: "김영희", extra_keywords: "", result: "" },
    ]);
    expect(
      XLSX.utils.sheet_to_json(workbook.Sheets.project_meta),
    ).toContainEqual({ key: "generatedCount", value: "1/2" });
  });

  it("한글 파일명과 긴 교사 수정본을 손실 없이 내보낸다", () => {
    const longEditedResult = `${"교사가 수정한 긴 결과 ".repeat(1000)}끝`;
    const students = createStudentRecords(
      [{ 이름: "홍길동", 활동: "토론" }],
      "session",
    );
    students[0] = {
      ...students[0]!,
      generatedResult: "AI 원본",
      result: longEditedResult,
      status: "success",
    };

    const { workbook, outputFileName } = buildResultsWorkbook({
      students,
      fileName: "한글 학생 명단.xlsx",
      mapping: { displayKey: "이름", activityKeys: ["활동"] },
      project: {
        schoolLevel: "high",
        recordType: "subject",
        subject: "국어",
        theme: "토론",
        targetBytes: 1500,
        format: "교사 시점",
        example: "예시",
      },
    });

    expect(outputFileName).toBe("한글 학생 명단_seeteuk_results.xlsx");
    expect(XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets.results)[0]?.result).toBe(
      longEditedResult,
    );
  });

  it("파일 시스템 저장 오류를 호출자에게 전달한다", () => {
    const students = createStudentRecords(
      [{ 이름: "홍길동", 활동: "토론" }],
      "session",
    );
    const exporter = new XlsxSpreadsheetExporter(() => {
      throw new Error("쓰기 권한 없음");
    });

    expect(() =>
      exporter.export({
        students,
        fileName: "학생.xlsx",
        mapping: { displayKey: "이름", activityKeys: ["활동"] },
        project: {
          schoolLevel: "high",
          recordType: "subject",
          subject: "국어",
          theme: "토론",
          targetBytes: 1500,
          format: "교사 시점",
          example: "예시",
        },
      }),
    ).toThrow("쓰기 권한 없음");
  });
});

describe("buildStarterWorkbook", () => {
  it("빈 양식에 입력 헤더와 별도 작성안내 시트를 제공한다", () => {
    const { workbook, outputFileName } = buildStarterWorkbook("blank");

    expect(outputFileName).toBe("세특척척_학생활동_빈_양식.xlsx");
    expect(workbook.SheetNames).toEqual(["학생활동", "작성안내"]);
    expect(
      XLSX.utils.sheet_to_json<string[]>(workbook.Sheets["학생활동"], {
        header: 1,
      }),
    ).toEqual([["이름", "학번", "활동", "관찰", "교사메모"]]);
    expect(
      XLSX.utils.sheet_to_json<Record<string, string>>(
        workbook.Sheets["작성안내"],
      ),
    ).toContainEqual({
      항목: "식별정보",
      안내:
        "이름과 학번은 학생 표시용입니다. AI 전송 활동 컬럼에서는 불필요한 식별정보를 제외하세요.",
    });
  });

  it("예시 파일은 가상 학생 데이터이며 앱에서 바로 읽을 수 있다", async () => {
    const { workbook, outputFileName } = buildStarterWorkbook("sample");
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets["학생활동"],
    );
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new File([bytes], outputFileName);

    expect(outputFileName).toBe("세특척척_예시_데이터.xlsx");
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.이름)).toEqual(["학생A", "학생B", "학생C"]);
    await expect(new XlsxSpreadsheetReader().read(file)).resolves.toEqual(rows);
  });
});
