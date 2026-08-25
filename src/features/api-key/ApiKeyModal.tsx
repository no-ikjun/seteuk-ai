type ApiKeyModalProps = {
  input: string;
  error: string;
  hasApiKey: boolean;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function ApiKeyModal({
  input,
  error,
  hasApiKey,
  onInputChange,
  onConfirm,
  onClose,
}: ApiKeyModalProps) {
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="card modalCard">
        <h2>OpenAI API Key 입력</h2>
        <p className="muted modalDescription">
          앱 사용을 위해 OpenAI API Key를 입력해주세요. 이 PC에는 저장되지
          않습니다.
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
        {error && <p className="error modalError">{error}</p>}
        <div className="row gap modalActions">
          <button
            className="btn primary"
            type="button"
            onClick={onConfirm}
            disabled={!input.trim()}
          >
            확인
          </button>
          {hasApiKey && (
            <button className="btn" type="button" onClick={onClose}>
              취소
            </button>
          )}
        </div>
        {!hasApiKey && (
          <p className="mutedSmall modalHint">
            ⚠️ API Key는 이 PC에 저장되지 않습니다. 앱을 종료하면 다시 입력해야
            합니다.
          </p>
        )}
      </div>
    </div>
  );
}
