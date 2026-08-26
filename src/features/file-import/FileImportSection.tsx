import { BrandMark } from "../../shared/brand/BrandMark";
import { DownloadIcon, SparkIcon, UploadIcon } from "../../shared/icons";
import { FilePickerLabel } from "./FilePickerLabel";

type FileImportSectionProps = {
  disabled: boolean;
  onUpload: (file: File) => void;
  onLoadSample: () => void;
  onDownloadBlankTemplate: () => void;
  onDownloadSample: () => void;
};

/* 파일을 열기 전 시작 화면.
   파일을 연 뒤의 파일 정보는 FileSettingsSection이 설정 영역에서 맡는다. */
export function FileImportSection({
  disabled,
  onUpload,
  onLoadSample,
  onDownloadBlankTemplate,
  onDownloadSample,
}: FileImportSectionProps) {
  return (
    <section className="card startCard">
      <div className="startHero">
        <BrandMark size={64} />
        <h2>학생 활동 기록으로 세특 초안을 만듭니다</h2>
        <p className="startLead">
          엑셀 파일을 불러오면 작성 조건과 컬럼을 확인한 뒤 학생별로 초안을
          생성합니다. 최종 판단과 표현은 언제나 선생님의 몫입니다.
        </p>
      </div>

      <FilePickerLabel
        className="uploadZone"
        disabled={disabled}
        onUpload={onUpload}
      >
        <span className="uploadZoneIcon">
          <UploadIcon size={18} />
        </span>
        <span className="uploadZoneTitle">엑셀 파일 선택</span>
        <span className="mutedSmall">
          .xlsx · .xls · .csv · 첫 번째 워크시트의 첫 행을 컬럼명으로 읽습니다
        </span>
      </FilePickerLabel>

      {/* 파일을 준비하지 않은 사람도 흐름을 볼 수 있게 주 동작 바로 옆에 둔다. */}
      <div className="row gap startActions">
        <button
          className="btn accent"
          type="button"
          disabled={disabled}
          onClick={onLoadSample}
        >
          <SparkIcon />
          예시 데이터로 둘러보기
        </button>
        <span className="mutedSmall">
          가상 학생 3명으로 전체 흐름을 확인할 수 있습니다.
        </span>
      </div>

      <div className="row gap templateDownloads">
        <span className="mutedSmall">직접 작성할 파일이 필요하면</span>
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
        원본 데이터는 PC에 저장되지 않고 앱을 종료하면 초기화됩니다. 생성 시
        선택한 활동 컬럼의 내용만 OpenAI로 전송됩니다.
      </p>
    </section>
  );
}
