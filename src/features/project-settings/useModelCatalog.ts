import { useCallback, useEffect, useRef, useState } from "react";
import {
  availableModels,
  fallbackModel,
  findCuratedModel,
} from "../../domain/generation/ModelCatalog";
import type { ModelCatalogService } from "../../services/models/ModelCatalogService";

export type ModelAvailabilityStatus = "idle" | "loading" | "loaded" | "failed";

type UseModelCatalogOptions = {
  apiKey: string;
  service: ModelCatalogService;
  selectedModel: string;
  /* 고른 모델을 이 계정에서 못 쓸 때만 부른다. 생성 단계에 가서야 권한
     오류를 만나는 것보다, 고르는 자리에서 쓸 수 있는 모델로 옮기는 편이 낫다. */
  onSuggestModel: (model: string) => void;
};

/* 계정에서 쓸 수 있는 모델을 확인한다.
   목록 자체는 앱이 정하고(CURATED_MODELS), 이 조회는 그중 권한이 없는 모델을
   빼는 데만 쓴다. 그래서 조회가 실패해도 화면은 그대로 동작한다. */
export function useModelCatalog({
  apiKey,
  service,
  selectedModel,
  onSuggestModel,
}: UseModelCatalogOptions) {
  const [availableIds, setAvailableIds] = useState<string[] | null>(null);
  const [status, setStatus] = useState<ModelAvailabilityStatus>("idle");

  const suggestRef = useRef(onSuggestModel);
  const selectedRef = useRef(selectedModel);
  useEffect(() => {
    suggestRef.current = onSuggestModel;
    selectedRef.current = selectedModel;
  }, [onSuggestModel, selectedModel]);

  /* 늦게 도착한 응답이 새 응답을 덮어쓰지 않게 하는 순번. */
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!apiKey) {
      setAvailableIds(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");

    try {
      const models = await service.listModels(apiKey);
      if (requestRef.current !== requestId) return;
      const ids = models.map((model) => model.id);
      setAvailableIds(ids);
      setStatus("loaded");

      /* 고른 모델이 목록에서 빠졌다면 쓸 수 있는 것 중 가장 좋은 모델로 옮긴다.
         직접 입력한 이름은 우리가 판단할 수 없으므로 건드리지 않는다. */
      const selected = selectedRef.current;
      if (findCuratedModel(selected) && !ids.includes(selected)) {
        suggestRef.current(fallbackModel(availableModels(ids)));
      }
    } catch {
      if (requestRef.current !== requestId) return;
      /* 확인하지 못했을 뿐이므로 목록을 좁히지 않는다. */
      setAvailableIds(null);
      setStatus("failed");
    }
  }, [apiKey, service]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return {
    models: availableModels(availableIds),
    status,
    reload: load,
  };
}
