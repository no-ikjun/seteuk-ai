import type { ModelCatalogService, ModelInfo } from "./ModelCatalogService";

export class FakeModelCatalogService implements ModelCatalogService {
  readonly models: ModelInfo[];

  constructor(models: ModelInfo[] = []) {
    this.models = models;
  }

  async listModels() {
    return this.models;
  }
}
