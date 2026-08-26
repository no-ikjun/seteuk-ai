import { useState } from "react";
import type { ActivityEntry } from "../../domain/student/StudentRecord";
import { AlertIcon } from "../../shared/icons";

type ActivityPreviewProps = {
  entries: ActivityEntry[];
  rawText: string;
  clamped: boolean;
  hasActivityColumns: boolean;
};

/* 모델에 전송되는 학생 활동.
   기본은 컬럼별로 나눈 읽기 쉬운 목록이고, `전송 원문 보기`를 누르면 실제로
   보내는 문자열을 그대로 보여준다. 두 표현 모두 도메인의 activityEntries에서
   나오므로 어긋나지 않는다(StudentRecord.ts 참고).

   길이 제한으로 잘린 경우에는 목록이 실제 전송분보다 많을 수 있다. 그때는
   경고를 띄우고 원문을 확인하도록 안내한다. */
export function ActivityPreview({
  entries,
  rawText,
  clamped,
  hasActivityColumns,
}: ActivityPreviewProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <>
      <div className="fieldHead">
        <span className="label">AI로 전송될 학생 활동</span>
        <button
          className="btn small"
          type="button"
          aria-pressed={showRaw}
          onClick={() => setShowRaw((value) => !value)}
        >
          {showRaw ? "정리해서 보기" : "전송 원문 보기"}
        </button>
      </div>

      {showRaw ? (
        <textarea
          className="textarea mono editorFill"
          rows={12}
          value={rawText}
          readOnly
          aria-label="AI로 전송될 원문"
        />
      ) : (
        <div className="activityList editorFill" tabIndex={0}>
          {entries.map((entry) => (
            <div className="activityEntry" key={entry.key}>
              <span className="activityKey">{entry.key}</span>
              <p className="activityValue">{entry.value}</p>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="muted">
              선택한 활동 컬럼에 이 학생의 내용이 없습니다.
            </p>
          )}
        </div>
      )}

      <p className="mutedSmall textCount">
        {rawText.length.toLocaleString()}자 · 표시용 이름 컬럼은 제외됨
      </p>

      {clamped && (
        <p className="warn">
          <AlertIcon />
          <span>
            내용이 길어 일부만 전송됩니다. 실제 전송분은 `전송 원문 보기`에서
            확인하세요.
          </span>
        </p>
      )}

      {!hasActivityColumns && (
        <p className="warn">
          <AlertIcon />
          <span>활동 컬럼을 1개 이상 선택해야 생성할 수 있습니다.</span>
        </p>
      )}
    </>
  );
}
