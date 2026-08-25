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
  return (
    <section className="card">
      <h2>1. 파일 업로드</h2>
      <div className="row">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        {fileName ? (
          <span className="badge">{fileName}</span>
        ) : (
          <span className="muted">.xlsx/.xls/.csv</span>
        )}
        {studentCount > 0 && (
          <span className="badge">
            생성됨 {generatedCount}/{studentCount}
          </span>
        )}
      </div>
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
      {studentCount > 0 ? (
        <p className="muted">
          총 <b>{studentCount}</b>명 · 컬럼 <b>{columnCount}</b>개
        </p>
      ) : (
        <p className="muted">
          ※ 업로드한 원본 데이터는 PC에 저장되지 않습니다. 앱을 종료하면 모든
          데이터가 초기화됩니다.
        </p>
      )}
    </section>
  );
}
