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
  /* 파일을 거치지 않고 바로 불러올 예시 학생 행.
     시작 화면의 `예시로 둘러보기`가 쓴다. */
  sampleRows(): SourceRow[];
}
