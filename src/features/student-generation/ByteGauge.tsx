import {
  byteStatus,
  hangulCharsFor,
  neisByteLength,
} from "../../domain/record/NeisBytes";
import { RetryIcon } from "../../shared/icons";

type ByteGaugeProps = {
  text: string;
  targetBytes: number;
  /** 나이스가 받는 최대 Byte. 제한이 없는 항목은 null이다. */
  limitBytes: number | null;
  revising: boolean;
  disabled: boolean;
  onRevise: () => void;
};

const STATUS_NOTE = {
  over: "한도를 넘었습니다. 나이스에 넣으면 잘립니다.",
  near: "한도에 가깝습니다.",
  ok: "",
  empty: "",
} as const;

/* 나이스는 글자 수가 아니라 Byte로 입력을 받는다. 화면이 글자 수만 보여주면
   한도에 맞춰 쓴 글이 나이스에서 잘리고, 교사는 아낀 시간을 여기서 다시 쓴다.
   그래서 세는 단위를 나이스와 같게 두고, 가늠하기 쉬운 한글 자 수를 옆에 적는다. */
export function ByteGauge({
  text,
  targetBytes,
  limitBytes,
  revising,
  disabled,
  onRevise,
}: ByteGaugeProps) {
  const bytes = neisByteLength(text);
  const status = byteStatus(bytes, limitBytes);
  const ceiling = limitBytes ?? targetBytes;
  const ratio = ceiling > 0 ? Math.min(bytes / ceiling, 1) : 0;

  return (
    <div className={`byteGauge byteGauge-${status}`}>
      <div className="byteGaugeTrack">
        <div
          className="byteGaugeFill"
          style={{ width: `${ratio * 100}%` }}
          role="img"
          aria-label={`${bytes}바이트 사용, 한도 ${limitBytes ?? "없음"}`}
        />
      </div>
      <p className="byteGaugeText mutedSmall">
        <span className="byteGaugeCount">
          {bytes.toLocaleString()}
          {limitBytes !== null && ` / ${limitBytes.toLocaleString()}`} Byte
        </span>
        <span className="byteGaugeHangul">
          한글 약 {hangulCharsFor(bytes).toLocaleString()}자
          {limitBytes === null && " · 이 항목은 글자수 제한이 없습니다"}
        </span>
        {STATUS_NOTE[status] && (
          <span className="byteGaugeNote">{STATUS_NOTE[status]}</span>
        )}
        {/* 넘쳤을 때만 내놓는다. 평소에도 있으면 누를 이유가 없는 버튼이
            결과 아래에 늘 붙어 있게 된다. */}
        {status === "over" && (
          <button
            className="btn small"
            type="button"
            disabled={disabled || revising}
            title="문장의 내용은 두고 분량만 줄입니다"
            onClick={onRevise}
          >
            <RetryIcon size={13} />
            {revising ? "맞추는 중..." : "분량 맞추기"}
          </button>
        )}
      </p>
    </div>
  );
}
