export type ModelGrade = 1 | 2 | 3;

export type CuratedModel = {
  id: string;
  name: string;
  performance: ModelGrade;
  cost: ModelGrade;
  summary: string;
};

/* 화면에 올릴 모델을 앱이 직접 고른다.
   OpenAI가 주는 목록에는 성능이나 비용 정보가 없고 임베딩·음성 모델까지
   섞여 있어, 그대로 보여주면 선생님이 무엇을 골라야 할지 알 수 없다.
   그래서 목록은 여기서 정하고, 계정 조회는 '이 중 못 쓰는 것 걸러내기'에만 쓴다.

   금액은 적지 않는다. 단가는 수시로 바뀌는데 데스크톱 앱은 그만큼 자주
   업데이트되지 않아, 숫자를 적어 두면 머지않아 틀린 안내가 된다. */
export const CURATED_MODELS: CuratedModel[] = [
  {
    id: "gpt-5.6-sol",
    name: "가장 정확하게",
    performance: 3,
    cost: 3,
    summary:
      "문장이 가장 자연스럽고 기록에 없는 내용을 지어내는 일이 가장 적습니다. 비용이 가장 높습니다.",
  },
  {
    id: "gpt-5.6-terra",
    name: "균형 (권장)",
    performance: 2,
    cost: 2,
    summary:
      "품질과 비용이 균형을 이룹니다. 한 학급 분량의 세특 초안에는 대체로 충분합니다.",
  },
  {
    id: "gpt-5.6-luna",
    name: "가장 저렴하게",
    performance: 1,
    cost: 1,
    summary:
      "비용이 가장 낮습니다. 학생 수가 많거나 초안을 빠르게 훑어볼 때 씁니다.",
  },
];

export const DEFAULT_MODEL_ID = "gpt-5.6-terra";

export function findCuratedModel(id: string) {
  const target = id.trim();
  return CURATED_MODELS.find((model) => model.id === target);
}

/* 계정에서 쓸 수 있는 모델만 남긴다.
   조회에 실패했거나(availableIds가 null) 걸러낸 결과가 비면 거르지 않는다.
   목록을 좁히려다 고를 것을 하나도 남기지 않는 쪽이 더 나쁘다. */
export function availableModels(availableIds: string[] | null): CuratedModel[] {
  if (!availableIds) return CURATED_MODELS;
  const allowed = new Set(availableIds);
  const filtered = CURATED_MODELS.filter((model) => allowed.has(model.id));
  return filtered.length > 0 ? filtered : CURATED_MODELS;
}

/* 고른 모델을 계정에서 못 쓰게 됐을 때 대신 제안할 모델.
   목록이 성능 내림차순이므로 쓸 수 있는 것 중 가장 좋은 모델이 앞에 온다. */
export function fallbackModel(models: CuratedModel[]) {
  return models[0]?.id ?? DEFAULT_MODEL_ID;
}
