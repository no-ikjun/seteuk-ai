import { useMemo, type RefObject } from "react";
import {
  getStudentDisplay,
  getStudentStage,
  type StudentRecord,
  type StudentStage,
} from "../../domain/student/StudentRecord";
import {
  countByStage,
  STAGE_LABEL,
  type StudentFilter,
} from "./studentStatus";

type StudentListPanelProps = {
  students: StudentRecord[];
  filtered: { student: StudentRecord; index: number }[];
  currentIndex: number;
  displayKey: string;
  busy: boolean;
  query: string;
  filter: StudentFilter;
  searchRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: StudentFilter) => void;
  onSelectionChange: (studentId: string, selected: boolean) => void;
  onGoToIndex: (index: number) => void;
};

export function StudentListPanel({
  students,
  filtered,
  currentIndex,
  displayKey,
  busy,
  query,
  filter,
  searchRef,
  onQueryChange,
  onFilterChange,
  onSelectionChange,
  onGoToIndex,
}: StudentListPanelProps) {
  const counts = useMemo(() => countByStage(students), [students]);

  const total = students.length;
  /* 검토 완료는 초안이 있는 학생의 부분집합이다. 막대도 그렇게 겹쳐 그린다. */
  const draftedCount = counts.draft + counts.reviewed;
  const percent = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100);
  const progressText = `${total}명 중 초안 ${draftedCount}명, 검토 완료 ${counts.reviewed}명`;

  /* 생성 중은 일괄 생성이 도는 동안에만 뜻이 있어 그때만 칩을 낸다. */
  const filters: { value: StudentFilter; label: string; count: number }[] = [
    { value: "all", label: "전체", count: total },
    { value: "idle", label: STAGE_LABEL.idle, count: counts.idle },
    ...(counts.generating > 0
      ? [
          {
            value: "generating" as StudentFilter,
            label: STAGE_LABEL.generating,
            count: counts.generating,
          },
        ]
      : []),
    { value: "draft", label: STAGE_LABEL.draft, count: counts.draft },
    { value: "reviewed", label: STAGE_LABEL.reviewed, count: counts.reviewed },
    { value: "failed", label: STAGE_LABEL.failed, count: counts.failed },
  ];

  const allFilteredSelected =
    filtered.length > 0 && filtered.every(({ student }) => student.selected);

  return (
    <aside className="studentListPanel" aria-label="학생 목록">
      <div className="listProgress">
        <div className="listProgressHead">
          <span className="listProgressLabel">검토 완료</span>
          <span className="listProgressCount">
            {counts.reviewed}
            <span className="mutedSmall"> / {total}명</span>
          </span>
        </div>
        <div
          className="batchProgressTrack"
          role="progressbar"
          aria-label="검토 진행률"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={counts.reviewed}
          aria-valuetext={progressText}
          title={progressText}
        >
          {/* 아래층은 초안이 있는 비율, 위층은 그중 검토를 마친 비율이다. */}
          <div
            className="batchProgressFill drafted"
            style={{ width: `${percent(draftedCount)}%` }}
          />
          <div
            className="batchProgressFill done"
            style={{ width: `${percent(counts.reviewed)}%` }}
          />
        </div>
      </div>

      <input
        ref={searchRef}
        className="input"
        type="search"
        placeholder="학생 검색"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div className="filterChips" role="group" aria-label="상태 필터">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`pill ${filter === item.value ? "on" : ""}`}
            aria-pressed={filter === item.value}
            onClick={() => onFilterChange(item.value)}
          >
            {item.label} {item.count}
          </button>
        ))}
      </div>

      <label className="selectAllRow">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={(event) => {
            for (const { student } of filtered) {
              onSelectionChange(student.id, event.target.checked);
            }
          }}
          disabled={busy}
        />
        표시된 학생 전체 선택 ({filtered.length}명)
      </label>

      <div className="studentList">
        {filtered.map(({ student, index }) => {
          const stage: StudentStage = getStudentStage(student);
          return (
            <div
              className={`studentListRow ${index === currentIndex ? "active" : ""}`}
              key={student.id}
            >
              <input
                type="checkbox"
                aria-label={`${getStudentDisplay(student, displayKey)} 선택`}
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
                <span>{getStudentDisplay(student, displayKey)}</span>
                <span className={`status status-${stage}`}>
                  {STAGE_LABEL[stage]}
                </span>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="muted emptyList">검색 결과가 없습니다.</p>
        )}
      </div>
    </aside>
  );
}
