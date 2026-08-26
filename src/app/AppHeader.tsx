import { BrandMark } from "../shared/brand/BrandMark";
import { CheckIcon, DownloadIcon, KeyIcon } from "../shared/icons";

type AppHeaderProps = {
  hasApiKey: boolean;
  hasFile: boolean;
  disabled: boolean;
  onOpenApiKey: () => void;
  onExport: () => void;
};

export function AppHeader({
  hasApiKey,
  hasFile,
  disabled,
  onOpenApiKey,
  onExport,
}: AppHeaderProps) {
  return (
    <header className="header">
      <div className="headerLeft" data-tauri-drag-region>
        <BrandMark className="brandMark" size={36} />
        <div className="brandText">
          <h1>세특척척</h1>
          {/* 흐름 안내는 시작 화면에서만 쓸모가 있다. 작업 중에는 자리만
              차지하므로 파일을 연 뒤에는 감춘다. */}
          {!hasFile && (
            <p className="sub">
              엑셀 업로드 → 작성 조건 → 학생별 생성 → 엑셀(.xlsx) 저장
            </p>
          )}
        </div>
      </div>

      <div className="headerRight">
        {/* 키가 없는 것은 막힌 상태가 아니라 아직 안 넣은 상태다. 경고 대신
            바로 넣을 수 있는 버튼을 둔다. */}
        {hasApiKey ? (
          <>
            <span className="keyStatus on">
              <CheckIcon size={14} />
              API Key 입력됨
            </span>
            <button
              className="btn"
              type="button"
              disabled={disabled}
              onClick={onOpenApiKey}
            >
              API Key 변경
            </button>
          </>
        ) : (
          <button
            className="btn"
            type="button"
            disabled={disabled}
            onClick={onOpenApiKey}
          >
            <KeyIcon />
            API Key 입력
          </button>
        )}
        {hasFile && (
          <button
            className="btn accent"
            type="button"
            disabled={disabled}
            onClick={onExport}
          >
            <DownloadIcon />
            엑셀(.xlsx)로 저장
          </button>
        )}
      </div>
    </header>
  );
}
