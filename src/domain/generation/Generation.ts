import { DEFAULT_MODEL_ID } from "./ModelCatalog";
import type { Project } from "../project/Project";
import type { RecordType, SchoolLevel } from "../record/RecordSpec";

export type GenerationSettings = {
  model: string;
  requestTimeoutSeconds: number;
  maxRetries: number;
  batchDelayMs: number;
};

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  model: DEFAULT_MODEL_ID,
  requestTimeoutSeconds: 60,
  maxRetries: 2,
  batchDelayMs: 500,
};

export type GenerationRequest = {
  project: Project;
  settings: GenerationSettings;
  student: {
    activityText: string;
    extraKeywords: string;
  };
};

/* 이미 만들어진 문장의 분량만 맞추는 요청. 학생 활동 기록은 보내지 않는다. */
export type ReviseRequest = {
  settings: GenerationSettings;
  schoolLevel: SchoolLevel;
  recordType: RecordType;
  text: string;
  targetChars: number;
};

export type GenerationResult = {
  text: string;
  attempts: number;
};
