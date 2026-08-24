import * as XLSX from "xlsx";
import type { Row } from "./parseSheet";

export type ExportProject = {
  subject: string;
  theme: string;
  avgLength: number;
  format: string;
  example: string;
};

type BuildWorkbookParams = {
  rows: Row[];
  fileName: string;
  displayKey: string;
  extraByIdx: Record<number, string>;
  resultByIdx: Record<number, string>;
  project: ExportProject;
};

export function buildResultsWorkbook({
  rows,
  fileName,
  displayKey,
  extraByIdx,
  resultByIdx,
  project,
}: BuildWorkbookParams) {
  const base = fileName ? fileName.replace(/\.[^.]+$/, "") : "seeteuk";
  const outputFileName = `${base}_seeteuk_results.xlsx`;

  const resultRows = rows.map((row, index) => ({
    index: index + 1,
    display: displayKey
      ? (row[displayKey] ?? "").trim()
      : `#${index + 1}`,
    extra_keywords: (extraByIdx[index] ?? "").trim(),
    result: (resultByIdx[index] ?? "").trim(),
  }));

  const generatedCount = Object.values(resultByIdx).filter(
    (value) => (value ?? "").trim().length > 0,
  ).length;

  const metadataRows = [
    { key: "subject", value: project.subject },
    { key: "theme", value: project.theme },
    { key: "avgLength", value: String(project.avgLength) },
    { key: "format", value: project.format },
    { key: "example", value: project.example },
    { key: "sourceFile", value: fileName },
    { key: "generatedCount", value: `${generatedCount}/${rows.length}` },
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

export function exportResultsXlsx(params: BuildWorkbookParams) {
  const { workbook, outputFileName } = buildResultsWorkbook(params);
  XLSX.writeFile(workbook, outputFileName, { bookType: "xlsx" });
}
