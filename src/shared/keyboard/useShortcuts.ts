import { useEffect, useRef } from "react";

export type Shortcut = {
  /* KeyboardEvent.key 값. 비교는 대소문자를 구분하지 않는다. */
  key: string;
  /* ⌘(macOS) 또는 Ctrl 조합 여부. */
  mod?: boolean;
  run: () => void;
};

const APPLE_PATTERN = /Mac|iPhone|iPad|iPod/;

/* 화면에 단축키를 적을 때 쓰는 표기. */
export const MOD_LABEL =
  typeof navigator !== "undefined" && APPLE_PATTERN.test(navigator.userAgent)
    ? "⌘"
    : "Ctrl";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/* 창 전역 단축키.
   조합키 없는 단축키는 입력 요소에 포커스가 있을 때 가로채지 않는다.
   결과 textarea에서 ←/→로 커서를 옮기지 못하면 안 되기 때문이다.
   ⌘/Ctrl 조합은 입력 중에도 받는다. 키워드를 적고 바로 생성하는 흐름이
   이 단축키의 주 용도다. */
export function useShortcuts(shortcuts: Shortcut[], enabled: boolean) {
  const latest = useRef(shortcuts);

  useEffect(() => {
    latest.current = shortcuts;
  });

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.repeat) return;
      const mod = event.metaKey || event.ctrlKey;

      for (const shortcut of latest.current) {
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;
        if (Boolean(shortcut.mod) !== mod) continue;
        if (!shortcut.mod && isTypingTarget(event.target)) continue;

        event.preventDefault();
        shortcut.run();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
