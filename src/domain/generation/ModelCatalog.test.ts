import { describe, expect, it } from "vitest";
import {
  availableModels,
  CURATED_MODELS,
  DEFAULT_MODEL_ID,
  fallbackModel,
  findCuratedModel,
} from "./ModelCatalog";

describe("CURATED_MODELS", () => {
  it("기본 모델이 목록에 있다", () => {
    expect(findCuratedModel(DEFAULT_MODEL_ID)).toBeDefined();
  });

  it("성능 내림차순으로 둔다", () => {
    const grades = CURATED_MODELS.map((model) => model.performance);
    expect(grades).toEqual([...grades].sort((a, b) => b - a));
  });

  it("성능이 높을수록 비용도 높다", () => {
    for (const model of CURATED_MODELS) {
      expect(model.cost).toBe(model.performance);
    }
  });

  it("금액을 적지 않는다", () => {
    for (const model of CURATED_MODELS) {
      expect(model.summary).not.toMatch(/\$|달러|원\/|USD/);
    }
  });
});

describe("findCuratedModel", () => {
  it("앞뒤 공백을 무시하고 찾는다", () => {
    expect(findCuratedModel(" gpt-5.6-luna ")?.id).toBe("gpt-5.6-luna");
  });

  it("목록에 없으면 undefined다", () => {
    expect(findCuratedModel("gpt-4o")).toBeUndefined();
    expect(findCuratedModel("")).toBeUndefined();
  });
});

describe("availableModels", () => {
  it("조회하지 못했으면 전부 보여준다", () => {
    expect(availableModels(null)).toEqual(CURATED_MODELS);
  });

  it("계정에서 쓸 수 있는 모델만 남긴다", () => {
    const models = availableModels(["gpt-5.6-luna", "text-embedding-3-small"]);
    expect(models.map((model) => model.id)).toEqual(["gpt-5.6-luna"]);
  });

  it("하나도 안 남으면 거르지 않는다", () => {
    expect(availableModels(["gpt-4o"])).toEqual(CURATED_MODELS);
  });
});

describe("fallbackModel", () => {
  it("쓸 수 있는 것 중 성능이 가장 좋은 모델을 고른다", () => {
    expect(fallbackModel(availableModels(null))).toBe(CURATED_MODELS[0].id);
  });

  it("목록이 비면 기본 모델로 돌아간다", () => {
    expect(fallbackModel([])).toBe(DEFAULT_MODEL_ID);
  });
});
