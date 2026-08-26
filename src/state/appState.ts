import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
} from "../domain/generation/Generation";
import {
  DEFAULT_PROJECT,
  isProjectValid,
  type Project,
} from "../domain/project/Project";
import type {
  ColumnMapping,
  StudentRecord,
} from "../domain/student/StudentRecord";

export type BatchState = {
  running: boolean;
  cancellationRequested: boolean;
  done: number;
  total: number;
  failed: number;
};

export type AppState = {
  fileName: string;
  columns: string[];
  project: Project;
  generationSettings: GenerationSettings;
  mapping: ColumnMapping;
  students: StudentRecord[];
  currentIndex: number;
  batch: BatchState;
  error: string;
  notice: string;
  /* 알림이 새로 뜰 때마다 늘어난다. 같은 문구가 다시 떠도 자동 사라짐
     타이머를 새로 걸 수 있게 하려는 값이다. */
  noticeId: number;
};

export const INITIAL_APP_STATE: AppState = {
  fileName: "",
  columns: [],
  project: DEFAULT_PROJECT,
  generationSettings: DEFAULT_GENERATION_SETTINGS,
  mapping: { displayKey: "", activityKeys: [] },
  students: [],
  currentIndex: 0,
  batch: {
    running: false,
    cancellationRequested: false,
    done: 0,
    total: 0,
    failed: 0,
  },
  error: "",
  notice: "",
  noticeId: 0,
};

export type AppAction =
  | {
      type: "fileLoaded";
      fileName: string;
      columns: string[];
      mapping: ColumnMapping;
      students: StudentRecord[];
    }
  | { type: "projectChanged"; field: keyof Project; value: string | number }
  | {
      type: "generationSettingChanged";
      field: keyof GenerationSettings;
      value: string | number;
    }
  | { type: "displayColumnChanged"; column: string }
  | { type: "activityColumnToggled"; column: string }
  | { type: "currentIndexChanged"; index: number }
  | { type: "extraKeywordsChanged"; studentId: string; value: string }
  | { type: "studentSelectionChanged"; studentId: string; selected: boolean }
  | { type: "allStudentsSelectionChanged"; selected: boolean }
  | { type: "resultChanged"; studentId: string; value: string }
  | { type: "reviewToggled"; studentId: string; reviewed: boolean }
  | { type: "generationStarted"; studentId: string }
  | {
      type: "generationSucceeded";
      studentId: string;
      text: string;
      attempts: number;
    }
  | {
      type: "generationFailed";
      studentId: string;
      error: string;
      attempts: number;
    }
  | { type: "batchStarted"; total: number }
  | { type: "batchItemFinished"; failed: boolean }
  | { type: "batchCancellationRequested" }
  | { type: "batchFinished" }
  | { type: "errorChanged"; error: string }
  | { type: "noticeChanged"; notice: string };

function updateStudent(
  students: StudentRecord[],
  studentId: string,
  update: (student: StudentRecord) => StudentRecord,
) {
  return students.map((student) =>
    student.id === studentId ? update(student) : student,
  );
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "fileLoaded":
      return {
        ...state,
        fileName: action.fileName,
        columns: action.columns,
        mapping: action.mapping,
        students: action.students,
        currentIndex: 0,
        batch: {
          running: false,
          cancellationRequested: false,
          done: 0,
          total: 0,
          failed: 0,
        },
        error: "",
        notice: "",
      };
    case "projectChanged":
      return {
        ...state,
        project: { ...state.project, [action.field]: action.value },
      };
    case "generationSettingChanged":
      return {
        ...state,
        generationSettings: {
          ...state.generationSettings,
          [action.field]: action.value,
        },
      };
    case "displayColumnChanged":
      return {
        ...state,
        mapping: { ...state.mapping, displayKey: action.column },
      };
    case "activityColumnToggled": {
      const selected = state.mapping.activityKeys.includes(action.column);
      return {
        ...state,
        mapping: {
          ...state.mapping,
          activityKeys: selected
            ? state.mapping.activityKeys.filter(
                (column) => column !== action.column,
              )
            : [...state.mapping.activityKeys, action.column],
        },
      };
    }
    case "currentIndexChanged":
      return {
        ...state,
        currentIndex: Math.max(
          0,
          Math.min(action.index, Math.max(0, state.students.length - 1)),
        ),
      };
    case "extraKeywordsChanged":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) => ({
          ...student,
          extraKeywords: action.value,
        })),
      };
    case "studentSelectionChanged":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) => ({
          ...student,
          selected: action.selected,
        })),
      };
    case "allStudentsSelectionChanged":
      return {
        ...state,
        students: state.students.map((student) => ({
          ...student,
          selected: action.selected,
        })),
      };
    case "resultChanged":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) => ({
          ...student,
          result: action.value,
        })),
      };
    case "reviewToggled":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) =>
          /* 결과가 없는 학생은 검토할 것도 없다. */
          student.result.trim()
            ? { ...student, reviewed: action.reviewed }
            : student,
        ),
      };
    case "generationStarted":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) => ({
          ...student,
          status: "generating",
          retryCount: 0,
          error: undefined,
        })),
      };
    case "generationSucceeded":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) =>
          student.status === "generating"
            ? {
                ...student,
                generatedResult: action.text,
                result: action.text,
                status: "success",
                /* 초안이 통째로 바뀌었으므로 검토는 처음부터 다시 한다. */
                reviewed: false,
                retryCount: Math.max(0, action.attempts - 1),
                error: undefined,
              }
            : student,
        ),
      };
    case "generationFailed":
      return {
        ...state,
        students: updateStudent(state.students, action.studentId, (student) =>
          student.status === "generating"
            ? {
                ...student,
                status: "failed",
                retryCount: Math.max(0, action.attempts - 1),
                error: action.error,
              }
            : student,
        ),
      };
    case "batchStarted":
      return {
        ...state,
        batch: {
          running: true,
          cancellationRequested: false,
          done: 0,
          total: action.total,
          failed: 0,
        },
        error: "",
      };
    case "batchItemFinished":
      return {
        ...state,
        batch: {
          ...state.batch,
          done: state.batch.done + 1,
          failed: state.batch.failed + (action.failed ? 1 : 0),
        },
      };
    case "batchCancellationRequested":
      return state.batch.running
        ? {
            ...state,
            batch: { ...state.batch, cancellationRequested: true },
          }
        : state;
    case "batchFinished":
      return { ...state, batch: { ...state.batch, running: false } };
    case "errorChanged":
      return { ...state, error: action.error };
    case "noticeChanged":
      return {
        ...state,
        notice: action.notice,
        noticeId: state.noticeId + 1,
      };
  }
}

export function selectCurrentStudent(state: AppState) {
  return state.students[state.currentIndex];
}

export function selectGeneratedCount(state: AppState) {
  return state.students.filter((student) => student.result.trim()).length;
}

export function selectReviewedCount(state: AppState) {
  return state.students.filter(
    (student) => student.reviewed && student.result.trim(),
  ).length;
}

export function selectIsGenerating(state: AppState) {
  return state.students.some((student) => student.status === "generating");
}

/* API Key를 뺀 생성 준비 상태.
   키가 없어도 생성 버튼을 눌러 키 입력으로 이어질 수 있어야 하므로
   화면의 활성/비활성 판단은 이 값을 쓴다. */
export function selectIsGenerationReady(state: AppState) {
  return Boolean(
    selectCurrentStudent(state) &&
      isProjectValid(state.project) &&
      state.mapping.activityKeys.length > 0 &&
      state.generationSettings.model.trim() &&
      state.generationSettings.requestTimeoutSeconds >= 10 &&
      state.generationSettings.maxRetries >= 0 &&
      state.generationSettings.batchDelayMs >= 0,
  );
}

/* 실제로 요청을 보낼 수 있는지. 키까지 갖춰졌을 때만 참이다. */
export function selectCanGenerate(state: AppState, apiKey: string) {
  return Boolean(apiKey) && selectIsGenerationReady(state);
}
