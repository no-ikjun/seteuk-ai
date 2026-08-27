import "../App.css";
import { ApiKeyModal } from "../features/api-key/ApiKeyModal";
import { useApiKey } from "../features/api-key/useApiKey";
import { FileImportSection } from "../features/file-import/FileImportSection";
import { useModelCatalog } from "../features/project-settings/useModelCatalog";
import { ExportConfirmationModal } from "../features/result-export/ExportConfirmationModal";
import { StudentGenerationSection } from "../features/student-generation/StudentGenerationSection";
import { SendConfirmationModal } from "../features/student-generation/SendConfirmationModal";
import { TauriGenerationService } from "../services/generation/TauriGenerationService";
import { TauriModelCatalogService } from "../services/models/TauriModelCatalogService";
import {
  XlsxSpreadsheetExporter,
  XlsxSpreadsheetReader,
  XlsxSpreadsheetTemplateExporter,
} from "../services/spreadsheet/XlsxSpreadsheetService";
import { useShortcuts } from "../shared/keyboard/useShortcuts";
import { AppHeader } from "./AppHeader";
import { ToastStack } from "./ToastStack";
import { SettingsPanel } from "./SettingsPanel";
import { useSeeteukApp } from "./useSeeteukApp";

const generationService = new TauriGenerationService();
const modelCatalogService = new TauriModelCatalogService();
const spreadsheetReader = new XlsxSpreadsheetReader();
const spreadsheetExporter = new XlsxSpreadsheetExporter();
const spreadsheetTemplateExporter = new XlsxSpreadsheetTemplateExporter();

export default function App() {
  const apiKey = useApiKey();
  const app = useSeeteukApp({
    apiKey: apiKey.apiKey,
    onApiKeyRequired: apiKey.openForGeneration,
    generationService,
    spreadsheetReader,
    spreadsheetExporter,
    spreadsheetTemplateExporter,
  });

  /* 어떤 모델을 보여줄지는 앱이 정하고, 이 조회는 그중 이 계정에서 못 쓰는
     모델을 빼는 데만 쓴다. 조회에 실패해도 목록은 그대로 나온다. */
  const models = useModelCatalog({
    apiKey: apiKey.apiKey,
    service: modelCatalogService,
    selectedModel: app.state.generationSettings.model,
    onSuggestModel: (model) => app.changeGenerationSetting("model", model),
  });

  const busy = app.isGenerating || app.state.batch.running;
  const hasFile = app.state.students.length > 0;

  /* 학생 ID는 `<파일 세션 ID>:<행 번호>` 형식이라 파일을 새로 열 때마다
     달라진다. 이 값을 key로 주면 설정 영역이 다시 마운트되면서 펼친
     상태로 시작한다. */
  const fileSessionKey = app.state.students[0]?.id ?? "";

  /* 모달이 떠 있는 동안에는 단축키를 받지 않는다. 뒤에 가려진 화면이
     조용히 움직이면 안 된다. */
  const modalOpen =
    apiKey.isOpen ||
    app.pendingGeneration !== null ||
    app.pendingExport !== null;
  const shortcutsEnabled = hasFile && !modalOpen;

  /* 내보내기는 헤더가 갖고 있으므로 여기서 단축키를 건다. 나머지 단축키는
     대상이 학생 작업 영역 안에 있어 그쪽에서 처리한다. */
  useShortcuts(
    [{ key: "s", mod: true, run: app.exportResults }],
    shortcutsEnabled && !busy,
  );

  return (
    <div className={hasFile ? "app appShell" : "app"}>
      {apiKey.isOpen && (
        <ApiKeyModal
          input={apiKey.input}
          error={apiKey.error}
          prompt={apiKey.prompt}
          onInputChange={apiKey.setInput}
          onConfirm={apiKey.confirm}
          onClose={() => {
            /* 키 입력을 그만두면 미뤄 둔 생성 요청도 함께 버린다. */
            app.cancelPendingApiKeyRequest();
            apiKey.close();
          }}
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

      {app.pendingExport !== null && (
        <ExportConfirmationModal
          incompleteCount={app.pendingExport.incomplete}
          unreviewedCount={app.pendingExport.unreviewed}
          onConfirm={app.confirmExport}
          onCancel={app.cancelExportConfirmation}
        />
      )}

      <AppHeader
        hasApiKey={Boolean(apiKey.apiKey)}
        hasFile={hasFile}
        disabled={busy}
        onOpenApiKey={apiKey.open}
        onExport={app.exportResults}
      />

      <ToastStack
        notice={app.state.notice}
        error={app.state.error}
        onDismissNotice={app.dismissNotice}
        onDismissError={app.dismissError}
      />

      <main className="appMain">
        {hasFile ? (
          <>
            <SettingsPanel
              key={fileSessionKey}
              fileName={app.state.fileName}
              studentCount={app.state.students.length}
              columnCount={app.state.columns.length}
              generatedCount={app.generatedCount}
              columns={app.state.columns}
              project={app.state.project}
              generationSettings={app.state.generationSettings}
              mapping={app.state.mapping}
              disabled={busy}
              onUpload={(file) => void app.upload(file)}
              onDownloadBlankTemplate={() =>
                app.downloadStarterWorkbook("blank")
              }
              onDownloadSample={() => app.downloadStarterWorkbook("sample")}
              onProjectChange={app.changeProject}
              onGenerationSettingChange={app.changeGenerationSetting}
              models={models.models}
              modelStatus={models.status}
              onDisplayChange={app.changeDisplayColumn}
              onActivityToggle={app.toggleActivityColumn}
            />

            <StudentGenerationSection
              students={app.state.students}
              currentIndex={app.state.currentIndex}
              currentDisplay={app.currentDisplay}
              activityEntries={app.currentActivityEntries}
              activityText={app.currentActivityText}
              activityClamped={app.currentActivityClamped}
              extraKeywords={app.currentStudent?.extraKeywords ?? ""}
              generatedResult={app.currentStudent?.generatedResult ?? ""}
              result={app.currentStudent?.result ?? ""}
              targetLength={app.state.project.avgLength}
              currentStudent={app.currentStudent}
              reviewed={app.currentStudent?.reviewed ?? false}
              shortcutsEnabled={shortcutsEnabled}
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
              onReviewedChange={app.changeReviewed}
              onGenerateCurrent={() => app.requestGeneration("current")}
              onGenerateAll={() => app.requestGeneration("all")}
              onGenerateSelected={() => app.requestGeneration("selected")}
              onRetryFailed={() => app.requestGeneration("failed")}
              onCancelBatch={app.cancelBatch}
              onCopyResult={() => void app.copyCurrentResult()}
            />
          </>
        ) : (
          <FileImportSection
            disabled={busy}
            onUpload={(file) => void app.upload(file)}
            onLoadSample={app.loadSampleData}
            onDownloadBlankTemplate={() => app.downloadStarterWorkbook("blank")}
            onDownloadSample={() => app.downloadStarterWorkbook("sample")}
          />
        )}
      </main>
    </div>
  );
}
