import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeModelCatalogService } from "./FakeModelCatalogService";

const { invokeMock, isTauriMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(),
}));
vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: isTauriMock,
}));

import { TauriModelCatalogService } from "./TauriModelCatalogService";

describe("ModelCatalogService", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    isTauriMock.mockReset();
    isTauriMock.mockReturnValue(true);
  });

  it("Tauri Adapter가 invoke 세부 구현을 감싼다", async () => {
    const models = [{ id: "gpt-5.4", created: 2, ownedBy: "openai" }];
    invokeMock.mockResolvedValue(models);

    const result = await new TauriModelCatalogService().listModels("sk-test");

    expect(invokeMock).toHaveBeenCalledWith("list_models", {
      apiKey: "sk-test",
    });
    expect(result).toEqual(models);
  });

  it("Rust 오류 payload를 GenerationError로 바꾼다", async () => {
    invokeMock.mockRejectedValue({
      kind: "authentication",
      message: "키가 유효하지 않습니다.",
      retryable: false,
    });

    await expect(
      new TauriModelCatalogService().listModels("sk-test"),
    ).rejects.toMatchObject({
      kind: "authentication",
      message: "키가 유효하지 않습니다.",
    });
  });

  it("브라우저에서는 조회할 수 없다고 알린다", async () => {
    isTauriMock.mockReturnValue(false);

    await expect(
      new TauriModelCatalogService().listModels("sk-test"),
    ).rejects.toMatchObject({ kind: "invalid_request" });
  });

  it("API Key가 없으면 조회하지 않는다", async () => {
    await expect(
      new TauriModelCatalogService().listModels(""),
    ).rejects.toThrow("OpenAI API Key가 필요합니다.");
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("테스트용 구현은 주입한 목록을 그대로 돌려준다", async () => {
    const models = [{ id: "gpt-4o", created: 1, ownedBy: "openai" }];
    await expect(
      new FakeModelCatalogService(models).listModels(),
    ).resolves.toEqual(models);
  });
});
