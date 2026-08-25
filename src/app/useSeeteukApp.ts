import { useEffect, useReducer, useRef, useState } from "react";
import {
  clampText,
  createStudentRecords,
  getStudentDisplay,
  inferColumnMapping,
  joinActivity,
  type StudentRecord,
} from "../domain/student/StudentRecord";
import {
  toGenerationError,
  type GenerationService,
} from "../services/generation/GenerationService";
import type {
  SpreadsheetExporter,
  SpreadsheetReader,
  SpreadsheetTemplateExporter,
  StarterWorkbookKind,
} from "../services/spreadsheet/SpreadsheetService";
import { toErrorMessage } from "../shared/errors/toErrorMessage";
import {
  appReducer,
  INITIAL_APP_STATE,
  selectCanGenerate,
  selectCurrentStudent,
  selectGeneratedCount,
  selectIsGenerating,
} from "../state/appState";

type UseSeeteukAppParams = {
  apiKey: string;
  generationService: GenerationService;
  spreadsheetReader: SpreadsheetReader;
  spreadsheetExporter: SpreadsheetExporter;
  spreadsheetTemplateExporter: SpreadsheetTemplateExporter;
};

export type GenerationTarget = "current" | "all" | "selected" | "failed";

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function useSeeteukApp({
  apiKey,
  generationService,
  spreadsheetReader,
  spreadsheetExporter,
  spreadsheetTemplateExporter,
}: UseSeeteukAppParams) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);
  const [pendingGeneration, setPendingGeneration] =
    useState<GenerationTarget | null>(null);
  const [pendingExportCount, setPendingExportCount] = useState<number | null>(
    null,
  );
  const externalSendConfirmedRef = useRef(false);
  const cancelBatchRef = useRef(false);
  const currentStudent = selectCurrentStudent(state);
  const isGenerating = selectIsGenerating(state);
  const canGenerate = selectCanGenerate(state, apiKey);
  const busy = isGenerating || state.batch.running;

  useEffect(() => {
    if (!busy) return;
    const warnBeforeExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeExit);
    return () => window.removeEventListener("beforeunload", warnBeforeExit);
  }, [busy]);

  async function upload(file: File) {
    dispatch({ type: "errorChanged", error: "" });
    dispatch({ type: "noticeChanged", notice: "" });
    try {
      const rows = await spreadsheetReader.read(file);
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      cancelBatchRef.current = false;
      externalSendConfirmedRef.current = false;
      setPendingGeneration(null);
      setPendingExportCount(null);
      dispatch({
        type: "fileLoaded",
        fileName: file.name,
        columns,
        mapping: inferColumnMapping(columns),
        students: createStudentRecords(rows, createSessionId()),
      });
    } catch (error) {
      dispatch({
        type: "errorChanged",
        error: `파일을 읽을 수 없습니다: ${toErrorMessage(error)}`,
      });
    }
  }

  async function generateStudent(student: StudentRecord) {
    dispatch({ type: "generationStarted", studentId: student.id });
    try {
      const result = await generationService.generate(apiKey, {
        project: state.project,
        settings: state.generationSettings,
        student: {
          activityText: clampText(
            joinActivity(student.source, state.mapping.activityKeys),
          ),
          extraKeywords: student.extraKeywords.trim(),
        },
      });
      dispatch({
        type: "generationSucceeded",
        studentId: student.id,
        text: result.text,
        attempts: result.attempts,
      });
      return "";
    } catch (error) {
      const generationError = toGenerationError(error);
      const message = generationError.requestId
        ? `${generationError.message} (요청 ID: ${generationError.requestId})`
        : generationError.message;
      dispatch({
        type: "generationFailed",
        studentId: student.id,
        error: message,
        attempts: generationError.attempts,
      });
      return message;
    }
  }

  async function runBatch(targets: StudentRecord[]) {
    if (targets.length === 0) {
      dispatch({ type: "noticeChanged", notice: "생성할 학생이 없습니다." });
      return;
    }
    cancelBatchRef.current = false;
    dispatch({ type: "batchStarted", total: targets.length });
    dispatch({ type: "noticeChanged", notice: "" });

    try {
      for (const [index, student] of targets.entries()) {
        if (cancelBatchRef.current) break;
        const error = await generateStudent(student);
        dispatch({ type: "batchItemFinished", failed: Boolean(error) });
        if (index < targets.length - 1 && !cancelBatchRef.current) {
          await delay(state.generationSettings.batchDelayMs);
        }
      }
    } finally {
      dispatch({ type: "batchFinished" });
    }
  }

  async function executeGeneration(target: GenerationTarget) {
    dispatch({ type: "errorChanged", error: "" });
    if (target === "current") {
      if (!currentStudent) return;
      const error = await generateStudent(currentStudent);
      if (error) dispatch({ type: "errorChanged", error });
      return;
    }
    if (target === "all") {
      await runBatch(state.students.filter((student) => !student.result.trim()));
      return;
    }
    if (target === "selected") {
      await runBatch(state.students.filter((student) => student.selected));
      return;
    }
    await runBatch(state.students.filter((student) => student.status === "failed"));
  }

  function requestGeneration(target: GenerationTarget) {
    if (!canGenerate || busy) return;
    if (!externalSendConfirmedRef.current) {
      setPendingGeneration(target);
      return;
    }
    void executeGeneration(target);
  }

  function confirmGeneration() {
    if (!pendingGeneration) return;
    const target = pendingGeneration;
    externalSendConfirmedRef.current = true;
    setPendingGeneration(null);
    void executeGeneration(target);
  }

  function cancelBatch() {
    cancelBatchRef.current = true;
    dispatch({ type: "batchCancellationRequested" });
  }

  async function copyCurrentResult() {
    if (!currentStudent?.result) return;
    try {
      await navigator.clipboard.writeText(currentStudent.result);
      dispatch({ type: "errorChanged", error: "" });
      dispatch({ type: "noticeChanged", notice: "현재 학생의 결과를 복사했습니다." });
    } catch (error) {
      dispatch({
        type: "errorChanged",
        error: `복사 실패: ${toErrorMessage(error)}`,
      });
    }
  }

  function performExport() {
    try {
      spreadsheetExporter.export({
        students: state.students,
        fileName: state.fileName,
        mapping: state.mapping,
        project: state.project,
      });
      dispatch({ type: "errorChanged", error: "" });
      dispatch({ type: "noticeChanged", notice: "엑셀 결과 파일을 저장했습니다." });
    } catch (error) {
      dispatch({ type: "noticeChanged", notice: "" });
      dispatch({
        type: "errorChanged",
        error: `엑셀 결과 저장 실패: ${toErrorMessage(error)}`,
      });
    }
  }

  function exportResults() {
    if (state.students.length === 0) return;
    const incompleteCount = state.students.filter(
      (student) => !student.result.trim(),
    ).length;
    if (incompleteCount > 0) {
      setPendingExportCount(incompleteCount);
      return;
    }
    performExport();
  }

  function confirmExport() {
    if (pendingExportCount === null) return;
    setPendingExportCount(null);
    performExport();
  }

  function downloadStarterWorkbook(kind: StarterWorkbookKind) {
    try {
      spreadsheetTemplateExporter.exportStarterWorkbook(kind);
      dispatch({ type: "errorChanged", error: "" });
      dispatch({
        type: "noticeChanged",
        notice:
          kind === "sample"
            ? "가상 학생이 포함된 예시 엑셀 파일을 저장했습니다."
            : "학생 활동 입력용 빈 엑셀 양식을 저장했습니다.",
      });
    } catch (error) {
      dispatch({ type: "noticeChanged", notice: "" });
      dispatch({
        type: "errorChanged",
        error: `양식 저장 실패: ${toErrorMessage(error)}`,
      });
    }
  }

  return {
    state,
    currentStudent,
    currentDisplay: currentStudent
      ? getStudentDisplay(currentStudent, state.mapping.displayKey)
      : "",
    currentActivityText: currentStudent
      ? clampText(joinActivity(currentStudent.source, state.mapping.activityKeys))
      : "",
    generatedCount: selectGeneratedCount(state),
    selectedCount: state.students.filter((student) => student.selected).length,
    failedCount: state.students.filter((student) => student.status === "failed").length,
    isGenerating,
    canGenerate,
    pendingGeneration,
    pendingExportCount,
    upload,
    changeProject: (
      field: keyof typeof state.project,
      value: string | number,
    ) => dispatch({ type: "projectChanged", field, value }),
    changeGenerationSetting: (
      field: keyof typeof state.generationSettings,
      value: string | number,
    ) => dispatch({ type: "generationSettingChanged", field, value }),
    changeDisplayColumn: (column: string) =>
      dispatch({ type: "displayColumnChanged", column }),
    toggleActivityColumn: (column: string) =>
      dispatch({ type: "activityColumnToggled", column }),
    goToIndex: (index: number) =>
      dispatch({ type: "currentIndexChanged", index }),
    changeExtraKeywords: (value: string) => {
      if (currentStudent) {
        dispatch({
          type: "extraKeywordsChanged",
          studentId: currentStudent.id,
          value,
        });
      }
    },
    changeCurrentResult: (value: string) => {
      if (currentStudent) {
        dispatch({ type: "resultChanged", studentId: currentStudent.id, value });
      }
    },
    changeStudentSelection: (studentId: string, selected: boolean) =>
      dispatch({ type: "studentSelectionChanged", studentId, selected }),
    requestGeneration,
    confirmGeneration,
    cancelGenerationConfirmation: () => setPendingGeneration(null),
    cancelBatch,
    copyCurrentResult,
    exportResults,
    confirmExport,
    cancelExportConfirmation: () => setPendingExportCount(null),
    downloadStarterWorkbook,
  };
}
