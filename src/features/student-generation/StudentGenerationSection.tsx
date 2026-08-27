import { useMemo, useRef, useState } from "react";
import type { ComplianceFinding } from "../../domain/compliance/ComplianceCheck";
import {
  getStudentDisplay,
  getStudentStage,
  type ActivityEntry,
  type ColumnMapping,
  type StudentRecord,
} from "../../domain/student/StudentRecord";
import {
  AlertIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  RetryIcon,
  SparkIcon,
  StopIcon,
} from "../../shared/icons";
import { MOD_LABEL, useShortcuts } from "../../shared/keyboard/useShortcuts";
import type { BatchState } from "../../state/appState";
import { ByteGauge } from "./ByteGauge";
import { ComplianceNotice } from "./ComplianceNotice";
import { ActivityPreview } from "./ActivityPreview";
import { StudentListPanel } from "./StudentListPanel";
import {
  matchesFilter,
  STAGE_LABEL,
  type StudentFilter,
} from "./studentStatus";

type StudentGenerationSectionProps = {
  students: StudentRecord[];
  currentIndex: number;
  currentDisplay: string;
  activityEntries: ActivityEntry[];
  activityText: string;
  activityClamped: boolean;
  extraKeywords: string;
  generatedResult: string;
  result: string;
  targetBytes: number;
  limitBytes: number | null;
  isRevising: boolean;
  complianceFindings: ComplianceFinding[];
  currentStudent?: StudentRecord;
  studentRetryCount: number;
  reviewed: boolean;
  studentError?: string;
  mapping: ColumnMapping;
  batch: BatchState;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedCount: number;
  failedCount: number;
  shortcutsEnabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onGoToIndex: (index: number) => void;
  onSelectionChange: (studentId: string, selected: boolean) => void;
  onExtraKeywordsChange: (value: string) => void;
  onResultChange: (value: string) => void;
  onReviewedChange: (reviewed: boolean) => void;
  onGenerateCurrent: () => void;
  onGenerateAll: () => void;
  onGenerateSelected: () => void;
  onRetryFailed: () => void;
  onCancelBatch: () => void;
  onCopyResult: () => void;
  onReviseLength: () => void;
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

/* 목표에서 10% 넘게 벗어나면 색으로 알린다. 목표는 평균 분량이라 딱 맞춰야
   하는 값이 아니므로 경고가 아니라 참고 표시로 둔다. */
export function StudentGenerationSection({
  students,
  currentIndex,
  currentDisplay,
  activityEntries,
  activityText,
  activityClamped,
  extraKeywords,
  generatedResult,
  result,
  targetBytes,
  limitBytes,
  isRevising,
  complianceFindings,
  currentStudent,
  studentRetryCount,
  reviewed,
  studentError,
  mapping,
  batch,
  canGenerate,
  isGenerating,
  selectedCount,
  failedCount,
  shortcutsEnabled,
  onPrevious,
  onNext,
  onGoToIndex,
  onSelectionChange,
  onExtraKeywordsChange,
  onResultChange,
  onReviewedChange,
  onGenerateCurrent,
  onGenerateAll,
  onGenerateSelected,
  onRetryFailed,
  onCancelBatch,
  onCopyResult,
  onReviseLength,
}: StudentGenerationSectionProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const busy = isGenerating || batch.running;
  const progressText = batchProgressText(batch);
  const isEdited = Boolean(
    result && generatedResult && result !== generatedResult,
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    return students
      .map((student, index) => ({ student, index }))
      .filter(({ student }) => {
        const display = getStudentDisplay(student, mapping.displayKey);
        return (
          (!normalizedQuery ||
            display.toLocaleLowerCase("ko").includes(normalizedQuery)) &&
          matchesFilter(student, filter)
        );
      });
  }, [filter, mapping.displayKey, query, students]);

  /* 일괄 생성이 끝난 뒤 실패한 학생만 남기고 첫 실패 학생으로 옮긴다.
     실패 목록을 직접 찾아 필터를 바꾸는 수고를 없앤다. */
  function showFailedStudents() {
    setQuery("");
    setFilter("failed");
    const firstFailed = students.findIndex(
      (student) => student.status === "failed",
    );
    if (firstFailed >= 0) onGoToIndex(firstFailed);
  }

  useShortcuts(
    [
      {
        key: "ArrowLeft",
        run: () => {
          if (!busy && currentIndex > 0) onPrevious();
        },
      },
      {
        key: "ArrowRight",
        run: () => {
          if (!busy && currentIndex < students.length - 1) onNext();
        },
      },
      {
        key: "Enter",
        mod: true,
        run: () => {
          if (canGenerate && !busy) onGenerateCurrent();
        },
      },
      { key: "/", run: () => searchRef.current?.focus() },
    ],
    shortcutsEnabled,
  );

  return (
    <section className="card workspaceCard" aria-label="학생별 생성과 검토">
      {students.length === 0 ? (
        <p className="muted">먼저 엑셀 파일을 업로드하세요.</p>
      ) : (
        <>
          <div className="row gap actionBar">
            <button
              className="btn primary"
              type="button"
              onClick={onGenerateAll}
              disabled={!canGenerate || busy}
            >
              <SparkIcon />
              결과 없는 학생 생성
            </button>
            <button
              className="btn"
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
              <RetryIcon />
              실패 {failedCount}명 재시도
            </button>
            {batch.running && !batch.cancellationRequested && (
              <button className="btn" type="button" onClick={onCancelBatch}>
                <StopIcon />
                일괄 생성 중단
              </button>
            )}
          </div>

          {batch.total > 0 && (
            <div className="batchProgress">
              <div
                className="batchProgressTrack"
                role="progressbar"
                aria-label="일괄 생성 진행률"
                aria-valuemin={0}
                aria-valuemax={batch.total}
                aria-valuenow={batch.done}
                aria-valuetext={progressText}
              >
                <div
                  className="batchProgressFill"
                  style={{
                    width: `${Math.round((batch.done / batch.total) * 100)}%`,
                  }}
                />
              </div>
              <div className="row gap batchProgressFoot">
                <span className="mutedSmall">{progressText}</span>
                {failedCount > 0 && !batch.running && (
                  <button
                    className="btn small"
                    type="button"
                    onClick={showFailedStudents}
                  >
                    <AlertIcon size={13} />
                    실패 {failedCount}명 보기
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="studentWorkspace">
            <StudentListPanel
              students={students}
              filtered={filtered}
              currentIndex={currentIndex}
              displayKey={mapping.displayKey}
              busy={busy}
              query={query}
              filter={filter}
              searchRef={searchRef}
              onQueryChange={setQuery}
              onFilterChange={setFilter}
              onSelectionChange={onSelectionChange}
              onGoToIndex={onGoToIndex}
            />

            <div className="studentEditor">
              <div className="nav">
                <button
                  className="btn"
                  type="button"
                  title="이전 학생 (←)"
                  onClick={onPrevious}
                  disabled={currentIndex === 0 || busy}
                >
                  <ChevronLeftIcon />
                  이전
                </button>
                <div className="navCenter">
                  <div className="title">
                    {currentDisplay}{" "}
                    <span className="mutedSmall">
                      ({currentIndex + 1}/{students.length})
                    </span>
                    {currentStudent && (
                      <span
                        className={`status status-${getStudentStage(currentStudent)}`}
                      >
                        {STAGE_LABEL[getStudentStage(currentStudent)]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn"
                  type="button"
                  title="다음 학생 (→)"
                  onClick={onNext}
                  disabled={currentIndex === students.length - 1 || busy}
                >
                  다음
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="twoCol">
                <div className="editorCol">
                  <ActivityPreview
                    entries={activityEntries}
                    rawText={activityText}
                    clamped={activityClamped}
                    hasActivityColumns={mapping.activityKeys.length > 0}
                  />
                </div>

                <div className="editorCol resultCol">
                  <label className="label">교사 추가 키워드(선택)</label>
                  <textarea
                    className="textarea keywordInput"
                    rows={2}
                    placeholder="예: 발표 주도, 근거 제시 우수, 자기주도 탐구"
                    value={extraKeywords}
                    onChange={(event) =>
                      onExtraKeywordsChange(event.target.value)
                    }
                    disabled={busy}
                  />

                  <div className="row gap">
                    <button
                      className="btn accent"
                      type="button"
                      title={`현재 학생 생성 (${MOD_LABEL}+Enter)`}
                      disabled={!canGenerate || busy}
                      onClick={onGenerateCurrent}
                    >
                      <SparkIcon />
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
                      <CopyIcon />
                      결과 복사
                    </button>
                  </div>

                  {studentError && (
                    <p className="error">
                      <AlertIcon />
                      <span>
                        {studentError}
                        {studentRetryCount > 0 && (
                          <> · 자동 재시도 {studentRetryCount}회</>
                        )}
                      </span>
                    </p>
                  )}

                  {/* 결과에 딸린 조작은 라벨 옆에 모은다. 화면 맨 아래에 두면
                      오른쪽 아래에 뜨는 알림과 자리가 겹친다. */}
                  <div className="fieldHead">
                    <span className="label">
                      최종 결과
                      {/* 상태를 알리는 한 마디라 칩으로 만들지 않는다.
                          테두리를 두르면 라벨 줄의 높이가 그만큼 커진다. */}
                      {isEdited && <span className="editedNote">수정됨</span>}
                    </span>
                    <div className="fieldHeadActions">
                      {isEdited && (
                        <button
                          className="btn small"
                          type="button"
                          disabled={busy}
                          title="AI가 생성한 초안으로 되돌립니다"
                          onClick={() => onResultChange(generatedResult)}
                        >
                          <RetryIcon size={13} />
                          초안으로 되돌리기
                        </button>
                      )}
                      {/* 초안을 읽고 그대로 둔 학생과 아직 읽지 않은 학생을
                          구분하는 표시다. 다시 생성하면 자동으로 풀린다. */}
                      <label className="reviewToggle">
                        <input
                          className="visuallyHidden"
                          type="checkbox"
                          checked={reviewed}
                          disabled={busy || !result.trim()}
                          onChange={(event) =>
                            onReviewedChange(event.target.checked)
                          }
                        />
                        <CheckIcon size={13} />
                        검토 완료
                      </label>
                    </div>
                  </div>
                  <textarea
                    className="textarea editorFill"
                    rows={12}
                    value={result}
                    onChange={(event) => onResultChange(event.target.value)}
                    disabled={busy || !generatedResult}
                    placeholder="생성 결과가 여기에 표시됩니다. 생성 후 수정한 내용이 엑셀에 저장됩니다."
                  />
                  <ComplianceNotice findings={complianceFindings} />
                  <ByteGauge
                    text={result}
                    targetBytes={targetBytes}
                    limitBytes={limitBytes}
                    revising={isRevising}
                    disabled={busy}
                    onRevise={onReviseLength}
                  />
                  {studentRetryCount > 0 && (
                    <p className="mutedSmall textCount">
                      자동 재시도 {studentRetryCount}회 후 완료
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
