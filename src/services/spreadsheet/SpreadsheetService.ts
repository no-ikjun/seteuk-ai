import type { Project } from "../../domain/project/Project";
import type {
  ColumnMapping,
  SourceRow,
  StudentRecord,
} from "../../domain/student/StudentRecord";

export interface SpreadsheetReader {
  read(file: File): Promise<SourceRow[]>;
}

export type SpreadsheetExportInput = {
  students: StudentRecord[];
  fileName: string;
  mapping: ColumnMapping;
  project: Project;
};

export interface SpreadsheetExporter {
  export(input: SpreadsheetExportInput): void;
}

export type StarterWorkbookKind = "blank" | "sample";

export interface SpreadsheetTemplateExporter {
  exportStarterWorkbook(kind: StarterWorkbookKind): void;
}
