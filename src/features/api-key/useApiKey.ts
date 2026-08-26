import { useState } from "react";

/* 모달이 열린 까닭. 생성을 누르다 열린 경우에는 왜 필요한지 알려준다. */
export type ApiKeyPrompt = "manual" | "generation";

export function useApiKey() {
  const [apiKey, setApiKey] = useState("");
  const [input, setInputValue] = useState("");
  const [error, setError] = useState("");
  /* 앱을 켜자마자 묻지 않는다. 파일을 열고 설정을 확인하는 데는 키가
     필요 없으므로, 실제로 필요한 시점(생성 요청)까지 미룬다. */
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState<ApiKeyPrompt>("manual");

  function setInput(value: string) {
    setInputValue(value);
    setError("");
  }

  function confirm() {
    const value = input.trim();
    if (!value) {
      setError("API Key를 입력해주세요.");
      return;
    }
    if (!value.startsWith("sk-")) {
      setError("API Key는 sk- 로 시작해야 합니다.");
      return;
    }

    setApiKey(value);
    setIsOpen(false);
    setError("");
  }

  function openWith(nextPrompt: ApiKeyPrompt) {
    setInputValue("");
    setError("");
    setPrompt(nextPrompt);
    setIsOpen(true);
  }

  return {
    apiKey,
    input,
    error,
    isOpen,
    prompt,
    setInput,
    confirm,
    open: () => openWith("manual"),
    openForGeneration: () => openWith("generation"),
    /* 키가 없어도 앱을 계속 쓸 수 있으므로 언제나 닫을 수 있다. */
    close: () => {
      setInputValue("");
      setError("");
      setIsOpen(false);
    },
  };
}
