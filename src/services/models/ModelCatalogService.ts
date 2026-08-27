/* OpenAI가 모델 목록으로 돌려주는 값. 성능이나 비용 정보는 들어 있지 않아
   화면에 그대로 쓰지 않고, 계정에서 쓸 수 있는 모델을 가려내는 데만 쓴다. */
export type ModelInfo = {
  id: string;
  created: number;
  ownedBy: string;
};

export interface ModelCatalogService {
  listModels(apiKey: string): Promise<ModelInfo[]>;
}
