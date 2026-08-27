import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  GenerationError,
  toGenerationError,
} from "../generation/GenerationService";
import type { ModelCatalogService, ModelInfo } from "./ModelCatalogService";

export class TauriModelCatalogService implements ModelCatalogService {
  async listModels(apiKey: string) {
    if (!apiKey) throw new Error("OpenAI API Key가 필요합니다.");
    if (!isTauri()) {
      throw new GenerationError({
        kind: "invalid_request",
        message:
          "모델 목록 조회는 Tauri 데스크톱 앱에서만 사용할 수 있습니다.",
      });
    }

    try {
      return await invoke<ModelInfo[]>("list_models", { apiKey });
    } catch (error) {
      throw toGenerationError(error);
    }
  }
}
