import type { Project } from "../project/Project";

export type GenerationSettings = {
  model: string;
  requestTimeoutSeconds: number;
  maxRetries: number;
  batchDelayMs: number;
};

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  model: "gpt-4o",
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

export type GenerationResult = {
  text: string;
  attempts: number;
};
