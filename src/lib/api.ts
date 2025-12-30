import { invoke } from "@tauri-apps/api/core";

export type GenerateReq = {
  project: {
    subject: string;
    theme: string;
    avgLength: number;
    format: string;
    example: string;
  };
  student: { activityText: string; extraKeywords: string };
};

export async function generateSeeteuk(apiKey: string, params: GenerateReq) {
  if (!apiKey) {
    throw new Error("OpenAI API Key가 필요합니다.");
  }

  const { text } = await invoke<{ text: string }>("generate", {
    apiKey,
    body: params,
  });

  return { text };
}
