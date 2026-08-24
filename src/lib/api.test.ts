import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));

import { generateSeeteuk, type GenerateReq } from "./api";

const request: GenerateReq = {
  project: {
    subject: "국어",
    theme: "독서",
    avgLength: 420,
    format: "교사 관찰자 시점",
    example: "예시",
  },
  student: {
    activityText: "발표: 근거를 제시함",
    extraKeywords: "질문이 많음",
  },
};

describe("generateSeeteuk", () => {
  beforeEach(() => invokeMock.mockReset());

  it("Tauri generate command를 외부 생성 경계로 사용한다", async () => {
    invokeMock.mockResolvedValue({ text: "생성 결과" });

    await expect(generateSeeteuk("sk-test", request)).resolves.toEqual({
      text: "생성 결과",
    });
    expect(invokeMock).toHaveBeenCalledWith("generate", {
      apiKey: "sk-test",
      body: request,
    });
  });

  it("API Key가 없으면 Tauri를 호출하지 않는다", async () => {
    await expect(generateSeeteuk("", request)).rejects.toThrow(
      "OpenAI API Key가 필요합니다.",
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
