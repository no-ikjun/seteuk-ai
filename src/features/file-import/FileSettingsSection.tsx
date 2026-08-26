import { DownloadIcon, SheetIcon } from "../../shared/icons";
import { FilePickerLabel } from "./FilePickerLabel";

type FileSettingsSectionProps = {
  fileName: string;
  studentCount: number;
  columnCount: number;
  generatedCount: number;
  disabled: boolean;
  onUpload: (file: File) => void;
  onDownloadBlankTemplate: () => void;
  onDownloadSample: () => void;
};

/* 설정 영역 안에서 보여주는 파일 정보.
   파일명과 학생 수는 접힌 요약 줄에도 나오므로 여기서는 바꾸기와
   양식 내려받기, 개인정보 안내를 맡는다. */
export function FileSettingsSection({
  fileName,
  studentCount,
  columnCount,
  generatedCount,
  disabled,
  onUpload,
  onDownloadBlankTemplate,
  onDownloadSample,
}: FileSettingsSectionProps) {
  return (
    <div className="settingsSection">
      <h3 className="settingsSectionTitle">학생 활동 파일</h3>

      <div className="fileSummary">
        <SheetIcon className="fileSummaryIcon" size={18} />
        <span className="fileSummaryName">{fileName}</span>
        <span className="mutedSmall">
          학생 {studentCount}명 · 컬럼 {columnCount}개
        </span>
        <span className="badge">
          생성됨 {generatedCount}/{studentCount}
        </span>
        <span className="fileSummarySpacer" />
        <FilePickerLabel
          className="btn small"
          disabled={disabled}
          onUpload={onUpload}
        >
          다른 파일 선택
        </FilePickerLabel>
      </div>

      <div className="row gap">
        <span className="mutedSmall">양식이 필요하면</span>
        <button
          className="btn small"
          type="button"
          disabled={disabled}
          onClick={onDownloadBlankTemplate}
        >
          <DownloadIcon size={14} />
          빈 엑셀 양식 받기
        </button>
        <button
          className="btn small"
          type="button"
          disabled={disabled}
          onClick={onDownloadSample}
        >
          <DownloadIcon size={14} />
          예시 엑셀 받기
        </button>
      </div>

      <p className="muted">
        ※ 업로드한 원본 데이터는 PC에 저장되지 않습니다. 앱을 종료하면 모든
        데이터가 초기화됩니다.
      </p>
    </div>
  );
}
