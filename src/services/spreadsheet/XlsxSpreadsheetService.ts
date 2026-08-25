import * as XLSX from "xlsx";
import type { SourceRow } from "../../domain/student/StudentRecord";
import type {
  SpreadsheetExporter,
  SpreadsheetExportInput,
  SpreadsheetReader,
  SpreadsheetTemplateExporter,
  StarterWorkbookKind,
} from "./SpreadsheetService";

const STARTER_HEADERS = ["이름", "학번", "활동", "관찰", "교사메모"];

const SAMPLE_ROWS = [
  {
    이름: "학생A",
    학번: "S001",
    활동: "독서 토론에서 작품의 주제를 근거와 함께 설명함",
    관찰: "동료의 의견을 경청하고 자신의 해석을 보완함",
    교사메모: "질문을 통해 논의를 확장함",
  },
  {
    이름: "학생B",
    학번: "S002",
    활동: "발표 자료를 핵심 개념 중심으로 구조화함",
    관찰: "피드백을 반영해 자료의 표현과 근거를 수정함",
    교사메모: "발표 준비 과정이 성실함",
  },
  {
    이름: "학생C",
    학번: "S003",
    활동: "탐구 과정과 결과를 독서 기록장에 꾸준히 정리함",
    관찰: "핵심 개념을 자신의 말로 설명하고 사례와 연결함",
    교사메모: "자기주도적으로 추가 자료를 탐색함",
  },
];

const GUIDE_ROWS = [
  { 항목: "사용 순서", 안내: "학생활동 시트에 학생별 내용을 한 행씩 입력한 뒤 앱에서 파일을 불러옵니다." },
  { 항목: "첫 번째 시트", 안내: "앱은 첫 번째 워크시트만 학생 데이터로 읽습니다. 학생활동 시트의 순서를 바꾸지 마세요." },
  { 항목: "컬럼명", 안내: "첫 행은 반드시 컬럼명으로 유지합니다. 필요한 활동 컬럼은 자유롭게 추가할 수 있습니다." },
  { 항목: "식별정보", 안내: "이름과 학번은 학생 표시용입니다. AI 전송 활동 컬럼에서는 불필요한 식별정보를 제외하세요." },
  { 항목: "지원 형식", 안내: ".xlsx, .xls, .csv 파일의 첫 번째 워크시트를 지원합니다." },
  { 항목: "예시 데이터", 안내: "예시 파일의 학생과 활동은 모두 테스트를 위한 가상 데이터입니다." },
];

export class XlsxSpreadsheetReader implements SpreadsheetReader {
  async read(file: File): Promise<SourceRow[]> {
    const workbook = file.name.toLocaleLowerCase().endsWith(".csv")
      ? XLSX.read(await file.text(), { type: "string" })
      : XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });

    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          String(value ?? "").trim(),
        ]),
      ),
    );
  }
}

export function buildResultsWorkbook({
  students,
  fileName,
  mapping,
  project,
}: SpreadsheetExportInput) {
  const orderedStudents = [...students].sort(
    (left, right) => left.sourceRowIndex - right.sourceRowIndex,
  );
  const base = fileName ? fileName.replace(/\.[^.]+$/, "") : "seeteuk";
  const outputFileName = `${base}_seeteuk_results.xlsx`;
  const resultRows = orderedStudents.map((student) => ({
    index: student.sourceRowIndex + 1,
    display: mapping.displayKey
      ? (student.source[mapping.displayKey] ?? "").trim()
      : `#${student.sourceRowIndex + 1}`,
    extra_keywords: student.extraKeywords.trim(),
    result: student.result.trim(),
  }));
  const generatedCount = students.filter((student) => student.result.trim()).length;
  const metadataRows = [
    { key: "subject", value: project.subject },
    { key: "theme", value: project.theme },
    { key: "avgLength", value: String(project.avgLength) },
    { key: "format", value: project.format },
    { key: "example", value: project.example },
    { key: "sourceFile", value: fileName },
    { key: "generatedCount", value: `${generatedCount}/${students.length}` },
  ];

  const workbook = XLSX.utils.book_new();
  const resultsSheet = XLSX.utils.json_to_sheet(resultRows, {
    header: ["index", "display", "extra_keywords", "result"],
  });
  resultsSheet["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 30 },
    { wch: 80 },
  ];
  const metadataSheet = XLSX.utils.json_to_sheet(metadataRows, {
    header: ["key", "value"],
  });
  metadataSheet["!cols"] = [{ wch: 16 }, { wch: 90 }];

  XLSX.utils.book_append_sheet(workbook, resultsSheet, "results");
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "project_meta");
  return { workbook, outputFileName };
}

export class XlsxSpreadsheetExporter implements SpreadsheetExporter {
  private readonly writeFile: typeof XLSX.writeFile;

  constructor(writeFile: typeof XLSX.writeFile = XLSX.writeFile) {
    this.writeFile = writeFile;
  }

  export(input: SpreadsheetExportInput) {
    const { workbook, outputFileName } = buildResultsWorkbook(input);
    this.writeFile(workbook, outputFileName, { bookType: "xlsx" });
  }
}

export function buildStarterWorkbook(kind: StarterWorkbookKind) {
  const workbook = XLSX.utils.book_new();
  const studentSheet =
    kind === "sample"
      ? XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: STARTER_HEADERS })
      : XLSX.utils.aoa_to_sheet([STARTER_HEADERS]);
  studentSheet["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 48 },
    { wch: 48 },
    { wch: 36 },
  ];
  const guideSheet = XLSX.utils.json_to_sheet(GUIDE_ROWS, {
    header: ["항목", "안내"],
  });
  guideSheet["!cols"] = [{ wch: 18 }, { wch: 100 }];

  XLSX.utils.book_append_sheet(workbook, studentSheet, "학생활동");
  XLSX.utils.book_append_sheet(workbook, guideSheet, "작성안내");
  return {
    workbook,
    outputFileName:
      kind === "sample"
        ? "세특AI_예시_데이터.xlsx"
        : "세특AI_학생활동_빈_양식.xlsx",
  };
}

export class XlsxSpreadsheetTemplateExporter
  implements SpreadsheetTemplateExporter
{
  exportStarterWorkbook(kind: StarterWorkbookKind) {
    const { workbook, outputFileName } = buildStarterWorkbook(kind);
    XLSX.writeFile(workbook, outputFileName, { bookType: "xlsx" });
  }
}
