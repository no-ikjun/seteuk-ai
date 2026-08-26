import { useEffect, useReducer, useRef, useState } from "react";
import {
  activityEntries,
  clampText,
  createStudentRecords,
  getStudentDisplay,
  inferColumnMapping,
  joinActivity,
  type SourceRow,
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
  selectIsGenerationReady,
  selectGeneratedCount,
  selectReviewedCount,
  selectIsGenerating,
} from "../state/appState";

type UseSeeteukAppParams = {
  apiKey: string;
  /* 키 없이 생성을 누른 경우 호출된다. 키가 들어오면 미뤄 둔 요청을 잇는다. */
  onApiKeyRequired: () => void;
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

/* 성공 알림이 스스로 사라지기까지의 시간.
   오류는 사용자가 읽고 조치해야 하므로 자동으로 지우지 않는다. */
const NOTICE_TIMEOUT_MS = 4000;

export function useSeeteukApp({
  apiKey,
  onApiKeyRequired,
  generationService,
  spreadsheetReader,
  spreadsheetExporter,
  spreadsheetTemplateExporter,
}: UseSeeteukAppParams) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);
  const [pendingGeneration, setPendingGeneration] =
    useState<GenerationTarget | null>(null);
  /* 내보내기 확인에 필요한 두 숫자. 확인이 필요 없으면 null이다. */
  const [pendingExport, setPendingExport] = useState<{
    incomplete: number;
    unreviewed: number;
  } | null>(null);
  const externalSendConfirmedRef = useRef(false);
  const cancelBatchRef = useRef(false);
  const pendingAfterKeyRef = useRef<GenerationTarget | null>(null);
  const currentStudent = selectCurrentStudent(state);
  const isGenerating = selectIsGenerating(state);
  /* 화면은 키를 뺀 준비 상태로 판단한다. 키가 없으면 버튼을 막는 대신
     눌렀을 때 키 입력으로 이어진다. */
  const isGenerationReady = selectIsGenerationReady(state);
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

  /* 성공 알림은 일정 시간 뒤 스스로 사라진다. 같은 문구가 다시 떠도 타이머가
     새로 걸리도록 문구가 아니라 noticeId를 본다. */
  useEffect(() => {
    if (!state.notice) return;
    const timer = setTimeout(
      () => dispatch({ type: "noticeChanged", notice: "" }),
      NOTICE_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [state.notice, state.noticeId]);

  /* 업로드와 예시 불러오기가 같은 초기화를 거치도록 한곳에 모은다. */
  function startFileSession(fileName: string, rows: SourceRow[]) {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    cancelBatchRef.current = false;
    externalSendConfirmedRef.current = false;
    pendingAfterKeyRef.current = null;
    setPendingGeneration(null);
    setPendingExport(null);
    dispatch({
      type: "fileLoaded",
      fileName,
      columns,
      mapping: inferColumnMapping(columns),
      students: createStudentRecords(rows, createSessionId()),
    });
  }

  async function upload(file: File) {
    dispatch({ type: "errorChanged", error: "" });
    dispatch({ type: "noticeChanged", notice: "" });
    try {
      startFileSession(file.name, await spreadsheetReader.read(file));
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
    /* 화면은 키 없이도 버튼을 누를 수 있게 열려 있으므로, 실제로 요청을
       보내기 직전에 키까지 갖춰졌는지 여기서 한 번 더 확인한다. */
    if (!selectCanGenerate(state, apiKey) || busy) return;
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

  function startGeneration(target: GenerationTarget) {
    if (!externalSendConfirmedRef.current) {
      setPendingGeneration(target);
      return;
    }
    void executeGeneration(target);
  }

  function requestGeneration(target: GenerationTarget) {
    if (!isGenerationReady || busy) return;
    if (!apiKey) {
      /* 키를 받은 뒤 이어서 진행한다. 아래 effect가 그 시점의 최신
         state로 startGeneration을 부른다. */
      pendingAfterKeyRef.current = target;
      onApiKeyRequired();
      return;
    }
    startGeneration(target);
  }

  /* 키 입력을 취소한 경우. 나중에 다른 이유로 키를 넣었을 때 생성이
     조용히 시작되면 안 되므로 미뤄 둔 요청을 버린다. */
  function cancelPendingApiKeyRequest() {
    pendingAfterKeyRef.current = null;
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
    const incomplete = state.students.filter(
      (student) => !student.result.trim(),
    ).length;
    const unreviewed = state.students.filter(
      (student) => student.result.trim() && !student.reviewed,
    ).length;
    if (incomplete > 0 || unreviewed > 0) {
      setPendingExport({ incomplete, unreviewed });
      return;
    }
    performExport();
  }

  function confirmExport() {
    if (pendingExport === null) return;
    setPendingExport(null);
    performExport();
  }

  /* apiKey가 바뀐 렌더에서 실행되므로 이 안의 startGeneration은 최신
     state를 본다. 목적이 이 한 가지라 apiKey만 의존성으로 둔다. */
  useEffect(() => {
    if (!apiKey) return;
    const target = pendingAfterKeyRef.current;
    if (target === null) return;
    pendingAfterKeyRef.current = null;
    startGeneration(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  /* 파일을 준비하지 않고도 흐름을 확인할 수 있게 예시 데이터를 바로 넣는다.
     내려받아 다시 올리는 두 단계를 없앤다. */
  function loadSampleData() {
    dispatch({ type: "errorChanged", error: "" });
    startFileSession(
      "세특척척_예시_데이터.xlsx",
      spreadsheetTemplateExporter.sampleRows(),
    );
    dispatch({
      type: "noticeChanged",
      notice: "예시 데이터를 불러왔습니다. 모두 가상 학생입니다.",
    });
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

  const currentActivityFullText = currentStudent
    ? joinActivity(currentStudent.source, state.mapping.activityKeys)
    : "";
  const currentActivityText = clampText(currentActivityFullText);

  return {
    state,
    currentStudent,
    currentDisplay: currentStudent
      ? getStudentDisplay(currentStudent, state.mapping.displayKey)
      : "",
    currentActivityText,
    /* 화면에 읽기 쉽게 보여줄 항목. 전송 문자열과 같은 도메인 함수에서 나온다. */
    currentActivityEntries: currentStudent
      ? activityEntries(currentStudent.source, state.mapping.activityKeys)
      : [],
    /* 길이 제한으로 잘렸는지. 잘린 경우 항목 목록이 실제 전송분보다 많다. */
    currentActivityClamped:
      currentActivityText !== currentActivityFullText,
    generatedCount: selectGeneratedCount(state),
    reviewedCount: selectReviewedCount(state),
    selectedCount: state.students.filter((student) => student.selected).length,
    failedCount: state.students.filter((student) => student.status === "failed").length,
    isGenerating,
    canGenerate: isGenerationReady,
    pendingGeneration,
    pendingExport,
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
    dismissNotice: () => dispatch({ type: "noticeChanged", notice: "" }),
    dismissError: () => dispatch({ type: "errorChanged", error: "" }),
    changeReviewed: (reviewed: boolean) => {
      if (!currentStudent) return;
      dispatch({
        type: "reviewToggled",
        studentId: currentStudent.id,
        reviewed,
      });
    },
    changeCurrentResult: (value: string) => {
      if (currentStudent) {
        dispatch({ type: "resultChanged", studentId: currentStudent.id, value });
      }
    },
    changeStudentSelection: (studentId: string, selected: boolean) =>
      dispatch({ type: "studentSelectionChanged", studentId, selected }),
    requestGeneration,
    cancelPendingApiKeyRequest,
    loadSampleData,
    confirmGeneration,
    cancelGenerationConfirmation: () => setPendingGeneration(null),
    cancelBatch,
    copyCurrentResult,
    exportResults,
    confirmExport,
    cancelExportConfirmation: () => setPendingExport(null),
    downloadStarterWorkbook,
  };
}
