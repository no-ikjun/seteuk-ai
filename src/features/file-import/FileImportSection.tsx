type FileImportSectionProps = {
  fileName: string;
  studentCount: number;
  columnCount: number;
  generatedCount: number;
  disabled: boolean;
  onUpload: (file: File) => void;
  onDownloadBlankTemplate: () => void;
  onDownloadSample: () => void;
};

export function FileImportSection({
  fileName,
  studentCount,
  columnCount,
  generatedCount,
  disabled,
  onUpload,
  onDownloadBlankTemplate,
  onDownloadSample,
}: FileImportSectionProps) {
  const hasFile = studentCount > 0;
  const fileInput = (
    <input
      className="visuallyHidden"
      type="file"
      accept=".xlsx,.xls,.csv"
      disabled={disabled}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onUpload(file);
        event.target.value = "";
      }}
    />
  );

  return (
    <section className="card">
      <h2>1. 학생 활동 파일</h2>

      {hasFile ? (
        <div className="fileSummary">
          <span className="fileSummaryName">{fileName}</span>
          <span className="mutedSmall">
            학생 {studentCount}명 · 컬럼 {columnCount}개
          </span>
          <span className="badge">
            생성됨 {generatedCount}/{studentCount}
          </span>
          <span className="fileSummarySpacer" />
          <label className="btn small" data-disabled={disabled || undefined}>
            {fileInput}
            다른 파일 선택
          </label>
        </div>
      ) : (
        <label className="uploadZone" data-disabled={disabled || undefined}>
          {fileInput}
          <span className="uploadZoneTitle">엑셀 파일 선택</span>
          <span className="mutedSmall">
            .xlsx · .xls · .csv · 첫 번째 워크시트의 첫 행을 컬럼명으로 읽습니다
          </span>
        </label>
      )}

      <div className="row gap templateDownloads">
        <span className="mutedSmall">처음 사용하거나 테스트하려면</span>
        <button
          className="btn small"
          type="button"
          disabled={disabled}
          onClick={onDownloadBlankTemplate}
        >
          빈 엑셀 양식 받기
        </button>
        <button
          className="btn small"
          type="button"
          disabled={disabled}
          onClick={onDownloadSample}
        >
          예시 엑셀 받기
        </button>
        <span className="mutedSmall">
          예시 파일은 가상 학생 데이터만 포함합니다.
        </span>
      </div>

      {hasFile ? (
        <p className="muted">
          ※ 업로드한 원본 데이터는 PC에 저장되지 않습니다. 앱을 종료하면 모든
          데이터가 초기화됩니다.
        </p>
      ) : (
        <p className="muted">
          파일을 불러오면 작성 조건, 컬럼 매핑, 학생별 생성 화면이 이어서
          나타납니다. 원본 데이터는 PC에 저장되지 않습니다.
        </p>
      )}
    </section>
  );
}
