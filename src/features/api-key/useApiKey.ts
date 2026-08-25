import { useState } from "react";

export function useApiKey() {
  const [apiKey, setApiKey] = useState("");
  const [input, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);

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

  function open() {
    setInputValue("");
    setError("");
    setIsOpen(true);
  }

  function close() {
    if (!apiKey) return;
    setInputValue("");
    setError("");
    setIsOpen(false);
  }

  return { apiKey, input, error, isOpen, setInput, confirm, open, close };
}
