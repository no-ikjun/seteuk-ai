import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseFile } from "./parseSheet";

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
  return new File([bytes], "students.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("parseFile", () => {
  it("첫 번째 워크시트만 읽고 모든 값을 정리된 문자열로 반환한다", async () => {
    await expect(parseFile(workbookFile())).resolves.toEqual([
      { 이름: "홍길동", 활동: "토론 참여" },
      { 이름: "김영희", 활동: "발표" },
    ]);
  });
});
