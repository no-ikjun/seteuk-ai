import type {
  GenerationRequest,
  GenerationResult,
} from "../../domain/generation/Generation";

export interface GenerationService {
  generate(apiKey: string, request: GenerationRequest): Promise<GenerationResult>;
}

export type GenerationErrorKind =
  | "authentication"
  | "quota"
  | "rate_limit"
  | "network"
  | "server"
  | "invalid_request"
  | "invalid_response"
  | "unknown";

export type GenerationErrorPayload = {
  kind?: GenerationErrorKind;
  message?: string;
  retryable?: boolean;
  attempts?: number;
  requestId?: string;
};

export class GenerationError extends Error {
  readonly kind: GenerationErrorKind;
  readonly retryable: boolean;
  readonly attempts: number;
  readonly requestId?: string;

  constructor(payload: GenerationErrorPayload) {
    super(payload.message || "OpenAI 요청 중 알 수 없는 오류가 발생했습니다.");
    this.name = "GenerationError";
    this.kind = payload.kind ?? "unknown";
    this.retryable = payload.retryable ?? false;
    this.attempts = Math.max(1, payload.attempts ?? 1);
    this.requestId = payload.requestId;
  }
}

export function toGenerationError(error: unknown) {
  if (error instanceof GenerationError) return error;
  if (typeof error === "object" && error !== null) {
    return new GenerationError(error as GenerationErrorPayload);
  }
  return new GenerationError({
    message: error instanceof Error ? error.message : String(error),
  });
}
