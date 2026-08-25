import { useMemo, useState } from "react";
import {
  getStudentDisplay,
  type ColumnMapping,
  type GenerationStatus,
  type StudentRecord,
} from "../../domain/student/StudentRecord";
import type { BatchState } from "../../state/appState";
import { ExportButton } from "../result-export/ExportButton";

type StudentGenerationSectionProps = {
  students: StudentRecord[];
  currentIndex: number;
  currentDisplay: string;
  currentActivityText: string;
  extraKeywords: string;
  generatedResult: string;
  result: string;
  studentStatus?: GenerationStatus;
  studentRetryCount: number;
  studentError?: string;
  mapping: ColumnMapping;
  batch: BatchState;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedCount: number;
  failedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToIndex: (index: number) => void;
  onSelectionChange: (studentId: string, selected: boolean) => void;
  onExtraKeywordsChange: (value: string) => void;
  onResultChange: (value: string) => void;
  onGenerateCurrent: () => void;
  onGenerateAll: () => void;
  onGenerateSelected: () => void;
  onRetryFailed: () => void;
  onCancelBatch: () => void;
  onCopyResult: () => void;
  onExport: () => void;
};

const STATUS_LABEL: Record<GenerationStatus, string> = {
  idle: "미생성",
  generating: "생성 중",
  success: "완료",
  failed: "실패",
};

function batchProgressText(batch: BatchState) {
  if (batch.running) {
    if (batch.cancellationRequested) {
      return `일괄 생성 중단 대기: ${batch.done}/${batch.total} (실패 ${batch.failed})`;
    }
    return `일괄 생성 중: ${batch.done}/${batch.total} (실패 ${batch.failed})`;
  }
  if (batch.total > 0) {
    if (batch.cancellationRequested) {
      return `일괄 생성 중단: ${batch.done}/${batch.total} (실패 ${batch.failed})`;
    }
    return `일괄 생성 완료: ${batch.done}/${batch.total} (실패 ${batch.failed})`;
  }
  return "";
}

export function StudentGenerationSection({
  students,
  currentIndex,
  currentDisplay,
  currentActivityText,
  extraKeywords,
  generatedResult,
  result,
  studentStatus,
  studentRetryCount,
  studentError,
  mapping,
  batch,
  canGenerate,
  isGenerating,
  selectedCount,
  failedCount,
  onPrevious,
  onNext,
  onGoToIndex,
  onSelectionChange,
  onExtraKeywordsChange,
  onResultChange,
  onGenerateCurrent,
  onGenerateAll,
  onGenerateSelected,
  onRetryFailed,
  onCancelBatch,
  onCopyResult,
  onExport,
}: StudentGenerationSectionProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GenerationStatus | "all">(
    "all",
  );
  const busy = isGenerating || batch.running;
  const progressText = batchProgressText(batch);
  const isEdited = Boolean(result && generatedResult && result !== generatedResult);
  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    return students
      .map((student, index) => ({ student, index }))
      .filter(({ student }) => {
        const display = getStudentDisplay(student, mapping.displayKey);
        return (
          (!normalizedQuery ||
            display.toLocaleLowerCase("ko").includes(normalizedQuery)) &&
          (statusFilter === "all" || student.status === statusFilter)
        );
      });
  }, [mapping.displayKey, query, statusFilter, students]);

  return (
    <section className="card">
      <h2>4. 학생별 생성 / 검토 / 내보내기</h2>

      {students.length === 0 ? (
        <p className="muted">먼저 엑셀 파일을 업로드하세요.</p>
      ) : (
        <>
          <div className="row gap actionBar">
            <ExportButton disabled={busy} onExport={onExport} />
            <button
              className="btn primary"
              type="button"
              onClick={onGenerateAll}
              disabled={!canGenerate || busy}
            >
              결과 없는 학생 생성
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={onGenerateSelected}
              disabled={!canGenerate || busy || selectedCount === 0}
            >
              선택 {selectedCount}명 생성
            </button>
            <button
              className="btn"
              type="button"
              onClick={onRetryFailed}
              disabled={!canGenerate || busy || failedCount === 0}
            >
              실패 {failedCount}명 재시도
            </button>
            {batch.running && !batch.cancellationRequested && (
              <button className="btn" type="button" onClick={onCancelBatch}>
                일괄 생성 중단
              </button>
            )}
            {progressText && <span className="badge">{progressText}</span>}
          </div>

          <div className="studentWorkspace">
            <aside className="studentListPanel" aria-label="학생 목록">
              <div className="studentFilters">
                <input
                  className="input"
                  type="search"
                  placeholder="학생 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as GenerationStatus | "all",
                    )
                  }
                >
                  <option value="all">모든 상태</option>
                  <option value="idle">미생성</option>
                  <option value="generating">생성 중</option>
                  <option value="success">완료</option>
                  <option value="failed">실패</option>
                </select>
              </div>
              <label className="selectAllRow">
                <input
                  type="checkbox"
                  checked={
                    filteredStudents.length > 0 &&
                    filteredStudents.every(({ student }) => student.selected)
                  }
                  onChange={(event) => {
                    for (const { student } of filteredStudents) {
                      onSelectionChange(student.id, event.target.checked);
                    }
                  }}
                  disabled={busy}
                />
                표시된 학생 전체 선택 ({filteredStudents.length}명)
              </label>
              <div className="studentList">
                {filteredStudents.map(({ student, index }) => (
                  <div
                    className={`studentListRow ${index === currentIndex ? "active" : ""}`}
                    key={student.id}
                  >
                    <input
                      type="checkbox"
                      aria-label={`${getStudentDisplay(student, mapping.displayKey)} 선택`}
                      checked={student.selected}
                      disabled={busy}
                      onChange={(event) =>
                        onSelectionChange(student.id, event.target.checked)
                      }
                    />
                    <button
                      type="button"
                      className="studentLink"
                      onClick={() => onGoToIndex(index)}
                      disabled={busy}
                    >
                      <span>{getStudentDisplay(student, mapping.displayKey)}</span>
                      <span className={`status status-${student.status}`}>
                        {STATUS_LABEL[student.status]}
                      </span>
                    </button>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="muted emptyList">검색 결과가 없습니다.</p>
                )}
              </div>
            </aside>

            <div className="studentEditor">
              <div className="nav">
                <button
                  className="btn"
                  type="button"
                  onClick={onPrevious}
                  disabled={currentIndex === 0 || busy}
                >
                  ← 이전
                </button>
                <div className="navCenter">
                  <div className="title">
                    {currentDisplay}{" "}
                    <span className="mutedSmall">
                      ({currentIndex + 1}/{students.length})
                    </span>
                    {studentStatus && (
                      <span className={`status status-${studentStatus}`}>
                        {STATUS_LABEL[studentStatus]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn"
                  type="button"
                  onClick={onNext}
                  disabled={currentIndex === students.length - 1 || busy}
                >
                  다음 →
                </button>
              </div>

              <div className="twoCol">
                <div>
                  <label className="label">
                    AI로 전송될 최종 학생 활동 텍스트
                  </label>
                  <textarea
                    className="textarea mono"
                    rows={12}
                    value={currentActivityText}
                    readOnly
                  />
                  <p className="mutedSmall textCount">
                    {currentActivityText.length.toLocaleString()}자 · 표시용 이름 컬럼은
                    제외됨
                  </p>
                  {mapping.activityKeys.length === 0 && (
                    <p className="warn">
                      활동 컬럼을 1개 이상 선택해야 생성할 수 있습니다.
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">교사 추가 키워드(선택)</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="예: 발표 주도, 근거 제시 우수, 자기주도 탐구"
                    value={extraKeywords}
                    onChange={(event) =>
                      onExtraKeywordsChange(event.target.value)
                    }
                    disabled={busy}
                  />

                  <div className="row gap">
                    <button
                      className="btn primary"
                      type="button"
                      disabled={!canGenerate || busy}
                      onClick={onGenerateCurrent}
                    >
                      {isGenerating && !batch.running
                        ? "생성 중..."
                        : result
                          ? "현재 학생 다시 생성"
                          : "현재 학생 생성"}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={onCopyResult}
                      disabled={!result}
                    >
                      결과 복사
                    </button>
                  </div>

                  {studentError && (
                    <p className="error">
                      {studentError}
                      {studentRetryCount > 0 && (
                        <> · 자동 재시도 {studentRetryCount}회</>
                      )}
                    </p>
                  )}

                  <label className="label">
                    최종 결과(교사가 직접 수정 가능){" "}
                    {isEdited && <span className="badge editedBadge">수정됨</span>}
                  </label>
                  <textarea
                    className="textarea"
                    rows={12}
                    value={result}
                    onChange={(event) => onResultChange(event.target.value)}
                    disabled={busy || !generatedResult}
                    placeholder="생성 결과가 여기에 표시됩니다. 생성 후 수정한 내용이 엑셀에 저장됩니다."
                  />
                  <p className="mutedSmall textCount">
                    {result.length.toLocaleString()}자
                    {studentRetryCount > 0 &&
                      ` · 자동 재시도 ${studentRetryCount}회 후 완료`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
