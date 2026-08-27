import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  GenerationRequest,
  ReviseRequest,
} from "../../domain/generation/Generation";
import {
  GenerationError,
  toGenerationError,
  type GenerationService,
} from "./GenerationService";

export class TauriGenerationService implements GenerationService {
  async generate(apiKey: string, request: GenerationRequest) {
    if (!apiKey) throw new Error("OpenAI API Key가 필요합니다.");
    if (!isTauri()) {
      throw new GenerationError({
        kind: "invalid_request",
        message:
          "AI 생성은 Tauri 데스크톱 앱에서만 사용할 수 있습니다. `npm run tauri:dev`로 실행해 주세요.",
      });
    }

    try {
      return await invoke<{ text: string; attempts: number }>("generate", {
        apiKey,
        body: request,
      });
    } catch (error) {
      throw toGenerationError(error);
    }
  }

  async reviseLength(apiKey: string, request: ReviseRequest) {
    if (!apiKey) throw new Error("OpenAI API Key가 필요합니다.");
    if (!isTauri()) {
      throw new GenerationError({
        kind: "invalid_request",
        message:
          "분량 맞추기는 Tauri 데스크톱 앱에서만 사용할 수 있습니다.",
      });
    }

    try {
      return await invoke<{ text: string; attempts: number }>("revise_length", {
        apiKey,
        body: request,
      });
    } catch (error) {
      throw toGenerationError(error);
    }
  }
}
