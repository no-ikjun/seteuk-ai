import { describe, expect, it } from "vitest";
import { createStudentRecords } from "../domain/student/StudentRecord";
import { appReducer, INITIAL_APP_STATE, type AppState } from "./appState";

function loadedState(): AppState {
  return appReducer(INITIAL_APP_STATE, {
    type: "fileLoaded",
    fileName: "students.xlsx",
    columns: ["이름", "활동"],
    mapping: { displayKey: "이름", activityKeys: ["활동"] },
    students: createStudentRecords(
      [
        { 이름: "홍길동", 활동: "토론" },
        { 이름: "김영희", 활동: "발표" },
      ],
      "session",
    ),
  });
}

describe("appReducer", () => {
  it("학교급을 바꾸면 그 학교급에 없는 항목을 함께 옮긴다", () => {
    const withClub = appReducer(INITIAL_APP_STATE, {
      type: "projectChanged",
      field: "recordType",
      value: "club",
    });
    expect(withClub.project.recordType).toBe("club");

    /* 초등학교는 동아리활동 특기사항을 자율·자치활동과 통합해 입력한다. */
    const elementary = appReducer(withClub, {
      type: "projectChanged",
      field: "schoolLevel",
      value: "elementary",
    });
    expect(elementary.project.schoolLevel).toBe("elementary");
    expect(elementary.project.recordType).toBe("autonomy");
  });

  it("학교급을 바꿔도 그 학교급에 있는 항목은 그대로 둔다", () => {
    const behavior = appReducer(INITIAL_APP_STATE, {
      type: "projectChanged",
      field: "recordType",
      value: "behavior",
    });
    const elementary = appReducer(behavior, {
      type: "projectChanged",
      field: "schoolLevel",
      value: "elementary",
    });
    expect(elementary.project.recordType).toBe("behavior");
  });

  it("학교급이 아닌 값을 바꿀 때는 항목을 건드리지 않는다", () => {
    const changed = appReducer(INITIAL_APP_STATE, {
      type: "projectChanged",
      field: "subject",
      value: "화학",
    });
    expect(changed.project.subject).toBe("화학");
    expect(changed.project.recordType).toBe(INITIAL_APP_STATE.project.recordType);
  });

  it("초안을 다시 생성하면 검토 완료 표시가 풀린다", () => {
    const base = loadedState();
    const studentId = base.students[0].id;
    const generated = appReducer(
      appReducer(base, { type: "generationStarted", studentId }),
      { type: "generationSucceeded", studentId, text: "첫 초안", attempts: 1 },
    );
    const reviewed = appReducer(generated, {
      type: "reviewToggled",
      studentId,
      reviewed: true,
    });
    expect(reviewed.students[0].reviewed).toBe(true);

    // 초안이 통째로 바뀌었으므로 검토는 처음부터 다시 해야 한다.
    const regenerated = appReducer(
      appReducer(reviewed, { type: "generationStarted", studentId }),
      { type: "generationSucceeded", studentId, text: "두 번째 초안", attempts: 1 },
    );

    expect(regenerated.students[0].result).toBe("두 번째 초안");
    expect(regenerated.students[0].reviewed).toBe(false);
  });

  it("결과가 없는 학생은 검토 완료로 표시되지 않는다", () => {
    const base = loadedState();
    const studentId = base.students[0].id;

    const next = appReducer(base, {
      type: "reviewToggled",
      studentId,
      reviewed: true,
    });

    expect(next.students[0].reviewed).toBe(false);
  });

  it("같은 알림이 다시 떠도 noticeId가 올라간다", () => {
    // 자동 사라짐 타이머는 문구가 아니라 noticeId를 보고 다시 걸린다.
    // 문구만 보면 같은 알림이 연달아 뜰 때 타이머가 갱신되지 않는다.
    const first = appReducer(INITIAL_APP_STATE, {
      type: "noticeChanged",
      notice: "복사했습니다.",
    });
    const second = appReducer(first, {
      type: "noticeChanged",
      notice: "복사했습니다.",
    });

    expect(second.notice).toBe(first.notice);
    expect(second.noticeId).toBeGreaterThan(first.noticeId);
  });

  it("새 파일 로드는 이전 학생 상태와 일괄 진행 상태를 한 번에 초기화한다", () => {
    const previous: AppState = {
      ...loadedState(),
      currentIndex: 1,
      batch: {
        running: false,
        cancellationRequested: false,
        done: 2,
        total: 2,
        failed: 1,
      },
      error: "이전 오류",
    };
    const nextStudents = createStudentRecords([{ 이름: "새 학생" }], "next");
    const next = appReducer(previous, {
      type: "fileLoaded",
      fileName: "new.xlsx",
      columns: ["이름"],
      mapping: { displayKey: "이름", activityKeys: [] },
      students: nextStudents,
    });

    expect(next.currentIndex).toBe(0);
    expect(next.students).toEqual(nextStudents);
    expect(next.batch).toEqual({
      running: false,
      cancellationRequested: false,
      done: 0,
      total: 0,
      failed: 0,
    });
    expect(next.error).toBe("");
  });

  it("학생 배열 순서가 달라져도 ID가 같은 학생에게 결과를 기록한다", () => {
    const started = appReducer(loadedState(), {
      type: "generationStarted",
      studentId: "session:1",
    });
    const reordered = { ...started, students: [...started.students].reverse() };
    const completed = appReducer(reordered, {
      type: "generationSucceeded",
      studentId: "session:1",
      text: "김영희 결과",
      attempts: 2,
    });

    expect(
      completed.students.find((student) => student.id === "session:1")?.result,
    ).toBe("김영희 결과");
    expect(
      completed.students.find((student) => student.id === "session:0")?.result,
    ).toBe("");
    expect(
      completed.students.find((student) => student.id === "session:1")
        ?.retryCount,
    ).toBe(1);
  });

  it("생성 시작 전 성공 이벤트는 잘못된 상태 전이로 보고 무시한다", () => {
    const state = loadedState();
    const next = appReducer(state, {
      type: "generationSucceeded",
      studentId: "session:0",
      text: "잘못된 결과",
      attempts: 1,
    });

    expect(next.students[0]?.status).toBe("idle");
    expect(next.students[0]?.result).toBe("");
  });

  it("현재 인덱스를 학생 범위 안으로 제한한다", () => {
    expect(
      appReducer(loadedState(), { type: "currentIndexChanged", index: 99 })
        .currentIndex,
    ).toBe(1);
  });

  it("실행 중인 일괄 생성에만 취소 요청 상태를 기록한다", () => {
    const idle = loadedState();
    expect(
      appReducer(idle, { type: "batchCancellationRequested" }),
    ).toBe(idle);

    const running = appReducer(idle, { type: "batchStarted", total: 2 });
    expect(
      appReducer(running, { type: "batchCancellationRequested" }).batch
        .cancellationRequested,
    ).toBe(true);
  });

  it("생성 원본을 보존하면서 교사가 최종 결과를 수정할 수 있다", () => {
    const started = appReducer(loadedState(), {
      type: "generationStarted",
      studentId: "session:0",
    });
    const generated = appReducer(started, {
      type: "generationSucceeded",
      studentId: "session:0",
      text: "AI 원본",
      attempts: 1,
    });
    const edited = appReducer(generated, {
      type: "resultChanged",
      studentId: "session:0",
      value: "교사 수정본",
    });

    expect(edited.students[0]?.generatedResult).toBe("AI 원본");
    expect(edited.students[0]?.result).toBe("교사 수정본");
  });

  it("실패 원인과 자동 재시도 횟수를 학생별로 저장한다", () => {
    const started = appReducer(loadedState(), {
      type: "generationStarted",
      studentId: "session:0",
    });
    const failed = appReducer(started, {
      type: "generationFailed",
      studentId: "session:0",
      error: "속도 제한",
      attempts: 3,
    });

    expect(failed.students[0]).toMatchObject({
      status: "failed",
      error: "속도 제한",
      retryCount: 2,
    });
  });

  it("학생 선택 상태를 개별 및 전체 변경할 수 있다", () => {
    const cleared = appReducer(loadedState(), {
      type: "allStudentsSelectionChanged",
      selected: false,
    });
    const selected = appReducer(cleared, {
      type: "studentSelectionChanged",
      studentId: "session:1",
      selected: true,
    });

    expect(selected.students.map((student) => student.selected)).toEqual([
      false,
      true,
    ]);
  });
});
