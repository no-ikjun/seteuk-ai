import "../App.css";
import { ApiKeyModal } from "../features/api-key/ApiKeyModal";
import { useApiKey } from "../features/api-key/useApiKey";
import { ColumnMappingSection } from "../features/column-mapping/ColumnMappingSection";
import { FileImportSection } from "../features/file-import/FileImportSection";
import { ProjectSettingsSection } from "../features/project-settings/ProjectSettingsSection";
import { ExportConfirmationModal } from "../features/result-export/ExportConfirmationModal";
import { StudentGenerationSection } from "../features/student-generation/StudentGenerationSection";
import { SendConfirmationModal } from "../features/student-generation/SendConfirmationModal";
import { TauriGenerationService } from "../services/generation/TauriGenerationService";
import {
  XlsxSpreadsheetExporter,
  XlsxSpreadsheetReader,
  XlsxSpreadsheetTemplateExporter,
} from "../services/spreadsheet/XlsxSpreadsheetService";
import { AppHeader } from "./AppHeader";
import { useSeeteukApp } from "./useSeeteukApp";

const generationService = new TauriGenerationService();
const spreadsheetReader = new XlsxSpreadsheetReader();
const spreadsheetExporter = new XlsxSpreadsheetExporter();
const spreadsheetTemplateExporter = new XlsxSpreadsheetTemplateExporter();

export default function App() {
  const apiKey = useApiKey();
  const app = useSeeteukApp({
    apiKey: apiKey.apiKey,
    generationService,
    spreadsheetReader,
    spreadsheetExporter,
    spreadsheetTemplateExporter,
  });
  const busy = app.isGenerating || app.state.batch.running;
  const hasFile = app.state.students.length > 0;

  return (
    <div className="wrap">
      {apiKey.isOpen && (
        <ApiKeyModal
          input={apiKey.input}
          error={apiKey.error}
          hasApiKey={Boolean(apiKey.apiKey)}
          onInputChange={apiKey.setInput}
          onConfirm={apiKey.confirm}
          onClose={apiKey.close}
        />
      )}

      {app.pendingGeneration && (
        <SendConfirmationModal
          target={app.pendingGeneration}
          model={app.state.generationSettings.model}
          onConfirm={app.confirmGeneration}
          onCancel={app.cancelGenerationConfirmation}
        />
      )}

      {app.pendingExportCount !== null && (
        <ExportConfirmationModal
          incompleteCount={app.pendingExportCount}
          onConfirm={app.confirmExport}
          onCancel={app.cancelExportConfirmation}
        />
      )}

      <AppHeader
        hasApiKey={Boolean(apiKey.apiKey)}
        disabled={busy}
        onChangeApiKey={apiKey.open}
      />

      {app.state.error && <p className="error appError">{app.state.error}</p>}
      {app.state.notice && (
        <p className="notice appNotice" role="status">
          {app.state.notice}
        </p>
      )}

      <FileImportSection
        fileName={app.state.fileName}
        studentCount={app.state.students.length}
        columnCount={app.state.columns.length}
        generatedCount={app.generatedCount}
        disabled={busy}
        onUpload={(file) => void app.upload(file)}
        onDownloadBlankTemplate={() => app.downloadStarterWorkbook("blank")}
        onDownloadSample={() => app.downloadStarterWorkbook("sample")}
      />

      {hasFile && (
        <>
          <section className="grid">
            <ProjectSettingsSection
              project={app.state.project}
              generationSettings={app.state.generationSettings}
              disabled={busy}
              onChange={app.changeProject}
              onGenerationSettingChange={app.changeGenerationSetting}
            />
            <ColumnMappingSection
              columns={app.state.columns}
              mapping={app.state.mapping}
              disabled={busy}
              onDisplayChange={app.changeDisplayColumn}
              onActivityToggle={app.toggleActivityColumn}
            />
          </section>

          <StudentGenerationSection
            students={app.state.students}
            currentIndex={app.state.currentIndex}
            currentDisplay={app.currentDisplay}
            currentActivityText={app.currentActivityText}
            extraKeywords={app.currentStudent?.extraKeywords ?? ""}
            generatedResult={app.currentStudent?.generatedResult ?? ""}
            result={app.currentStudent?.result ?? ""}
            studentStatus={app.currentStudent?.status}
            studentRetryCount={app.currentStudent?.retryCount ?? 0}
            studentError={app.currentStudent?.error}
            mapping={app.state.mapping}
            batch={app.state.batch}
            canGenerate={app.canGenerate}
            isGenerating={app.isGenerating}
            selectedCount={app.selectedCount}
            failedCount={app.failedCount}
            onPrevious={() => app.goToIndex(app.state.currentIndex - 1)}
            onNext={() => app.goToIndex(app.state.currentIndex + 1)}
            onGoToIndex={app.goToIndex}
            onSelectionChange={app.changeStudentSelection}
            onExtraKeywordsChange={app.changeExtraKeywords}
            onResultChange={app.changeCurrentResult}
            onGenerateCurrent={() => app.requestGeneration("current")}
            onGenerateAll={() => app.requestGeneration("all")}
            onGenerateSelected={() => app.requestGeneration("selected")}
            onRetryFailed={() => app.requestGeneration("failed")}
            onCancelBatch={app.cancelBatch}
            onCopyResult={() => void app.copyCurrentResult()}
            onExport={app.exportResults}
          />

          <footer className="foot">
            <span className="mutedSmall">
              ⚠️ 권장: 이름/학번 등 식별정보 컬럼은 “활동 컬럼”에서 제외할 것.
            </span>
          </footer>
        </>
      )}
    </div>
  );
}
