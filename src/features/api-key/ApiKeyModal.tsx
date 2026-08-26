import { AlertIcon } from "../../shared/icons";
import type { ApiKeyPrompt } from "./useApiKey";

type ApiKeyModalProps = {
  input: string;
  error: string;
  prompt: ApiKeyPrompt;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function ApiKeyModal({
  input,
  error,
  prompt,
  onInputChange,
  onConfirm,
  onClose,
}: ApiKeyModalProps) {
  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="card modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-title"
      >
        <h2 id="api-key-title">OpenAI API Key 입력</h2>
        <p className="muted modalDescription">
          {prompt === "generation"
            ? "세특 초안을 생성하려면 OpenAI API Key가 필요합니다. 이 PC에는 저장되지 않습니다."
            : "생성에 사용할 OpenAI API Key를 입력해주세요. 이 PC에는 저장되지 않습니다."}
        </p>
        <input
          className="input"
          type="password"
          placeholder="OpenAI API Key (sk-...)"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onConfirm();
          }}
          autoFocus
        />
        {error && (
          <p className="error modalError">
            <AlertIcon />
            <span>{error}</span>
          </p>
        )}
        <div className="row gap modalActions">
          <button
            className="btn primary"
            type="button"
            onClick={onConfirm}
            disabled={!input.trim()}
          >
            확인
          </button>
          <button className="btn" type="button" onClick={onClose}>
            취소
          </button>
        </div>
        <p className="mutedSmall modalHint">
          키는 OpenAI 계정의 <span className="mono">API keys</span> 화면에서
          발급합니다. 생성한 만큼 OpenAI 사용 요금이 발생합니다.
        </p>
        <p className="mutedSmall modalHint footNote">
          <AlertIcon size={14} />
          API Key는 이 PC에 저장되지 않습니다. 앱을 종료하면 다시 입력해야
          합니다.
        </p>
      </section>
    </div>
  );
}
