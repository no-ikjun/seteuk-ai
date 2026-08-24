import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { buildResultsWorkbook } from "./exportSheet";

describe("buildResultsWorkbook", () => {
  it("결과와 프로젝트 메타데이터를 두 시트에 보존한다", () => {
    const { workbook, outputFileName } = buildResultsWorkbook({
      rows: [
        { 이름: "홍길동", 활동: "토론" },
        { 이름: "김영희", 활동: "발표" },
      ],
      fileName: "학생 활동.xlsx",
      displayKey: "이름",
      extraByIdx: { 0: "질문이 많음" },
      resultByIdx: { 0: "첫 번째 세특" },
      project: {
        subject: "국어",
        theme: "독서 활동",
        avgLength: 420,
        format: "교사 관찰자 시점",
        example: "예시 문장",
      },
    });

    expect(outputFileName).toBe("학생 활동_seeteuk_results.xlsx");
    expect(workbook.SheetNames).toEqual(["results", "project_meta"]);

    const results = XLSX.utils.sheet_to_json(workbook.Sheets.results);
    expect(results).toEqual([
      {
        index: 1,
        display: "홍길동",
        extra_keywords: "질문이 많음",
        result: "첫 번째 세특",
      },
      { index: 2, display: "김영희", extra_keywords: "", result: "" },
    ]);

    const metadata = XLSX.utils.sheet_to_json(workbook.Sheets.project_meta);
    expect(metadata).toContainEqual({ key: "generatedCount", value: "1/2" });
    expect(metadata).toContainEqual({ key: "sourceFile", value: "학생 활동.xlsx" });
  });
});
