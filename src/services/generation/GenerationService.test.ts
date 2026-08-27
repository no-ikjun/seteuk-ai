import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationRequest } from "../../domain/generation/Generation";
import { FakeGenerationService } from "./FakeGenerationService";
import { toGenerationError } from "./GenerationService";

const { invokeMock, isTauriMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(),
}));
vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: isTauriMock,
}));

import { TauriGenerationService } from "./TauriGenerationService";

const request: GenerationRequest = {
  project: {
    schoolLevel: "high",
    recordType: "subject",
    subject: "국어",
    theme: "독서",
    targetBytes: 1500,
    format: "교사 관찰자 시점",
    example: "예시",
  },
  settings: {
    model: "gpt-4o",
    requestTimeoutSeconds: 60,
    maxRetries: 2,
    batchDelayMs: 500,
  },
  student: {
    activityText: "발표: 근거를 제시함",
    extraKeywords: "질문이 많음",
  },
};

describe("GenerationService", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    isTauriMock.mockReset();
    isTauriMock.mockReturnValue(true);
  });

  it("분량 맞추기는 학생 활동 기록 없이 문장만 보낸다", async () => {
    invokeMock.mockResolvedValue({ text: "줄인 결과", attempts: 1 });

    const result = await new TauriGenerationService().reviseLength("sk-test", {
      settings: request.settings,
      schoolLevel: "high",
      recordType: "subject",
      text: "원래 문장",
      targetChars: 500,
    });

    expect(invokeMock).toHaveBeenCalledWith("revise_length", {
      apiKey: "sk-test",
      body: {
        settings: request.settings,
        schoolLevel: "high",
        recordType: "subject",
        text: "원래 문장",
        targetChars: 500,
      },
    });
    /* 활동 기록이 요청에 실리지 않아야 개인정보가 더 나가지 않는다. */
    const [, body] = invokeMock.mock.calls[0];
    expect(JSON.stringify(body)).not.toContain("activityText");
    expect(result.text).toBe("줄인 결과");
  });

  it("Tauri Adapter가 invoke 세부 구현을 감싼다", async () => {
    invokeMock.mockResolvedValue({ text: "생성 결과", attempts: 2 });
    const service = new TauriGenerationService();

    await expect(service.generate("sk-test", request)).resolves.toEqual({
      text: "생성 결과",
      attempts: 2,
    });
    expect(invokeMock).toHaveBeenCalledWith("generate", {
      apiKey: "sk-test",
      body: request,
    });
  });

  it("API Key가 없으면 Tauri를 호출하지 않는다", async () => {
    const service = new TauriGenerationService();
    await expect(service.generate("", request)).rejects.toThrow(
      "OpenAI API Key가 필요합니다.",
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("일반 브라우저 실행에서는 Tauri 실행 방법을 안내한다", async () => {
    isTauriMock.mockReturnValue(false);
    const service = new TauriGenerationService();

    await expect(service.generate("sk-test", request)).rejects.toThrow(
      "AI 생성은 Tauri 데스크톱 앱에서만 사용할 수 있습니다.",
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("Fake Adapter로 외부 호출 없이 요청을 검증할 수 있다", async () => {
    const service = new FakeGenerationService("가짜 결과");
    await expect(service.generate("sk-test", request)).resolves.toEqual({
      text: "가짜 결과",
      attempts: 1,
    });
    expect(service.requests).toEqual([request]);
  });

  it("Tauri의 구조화된 오류를 재시도 정보와 함께 전달한다", async () => {
    const structured = toGenerationError({
      kind: "rate_limit",
      message: "요청 속도 제한",
      retryable: true,
      attempts: 3,
      requestId: "req_test",
    });

    expect(structured.message).toBe("요청 속도 제한");
    expect(structured.kind).toBe("rate_limit");
    expect(structured.retryable).toBe(true);
    expect(structured.attempts).toBe(3);
    expect(structured.requestId).toBe("req_test");
  });
});
