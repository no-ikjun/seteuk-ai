type AppHeaderProps = {
  hasApiKey: boolean;
  disabled: boolean;
  onChangeApiKey: () => void;
};

export function AppHeader({
  hasApiKey,
  disabled,
  onChangeApiKey,
}: AppHeaderProps) {
  return (
    <header className="header">
      <div className="headerLeft" data-tauri-drag-region>
        <h1>세특 자동 작성기 (로컬)</h1>
        <p className="sub">
          엑셀 업로드 → 프로젝트 입력(5항목) → 학생별/일괄 생성 → 엑셀(.xlsx)
          저장
        </p>
      </div>
      <div className="headerRight">
        <div className="row gap">
          <span className="badge">
            {hasApiKey ? "API Key 입력됨 ✅" : "API Key 필요"}
          </span>
          {hasApiKey && (
            <button
              className="btn"
              type="button"
              disabled={disabled}
              onClick={onChangeApiKey}
            >
              API Key 변경
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
