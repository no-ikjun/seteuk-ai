import type { RecordType, SchoolLevel } from "./RecordSpec";

/* 교육정보시스템(나이스)은 입력 글자를 Byte 단위로 센다. 기재요령이 밝힌 값은
   세 가지다.

     한글 1자 = 3Byte, 영문·숫자 1자 = 1Byte, 엔터 = 1Byte

   이 셋은 모두 UTF-8 바이트 길이와 정확히 같다. 그래서 규정에 값이 적히지
   않은 문자(한자, 전각 문장부호 등)를 짐작하지 않고 UTF-8 길이를 그대로 센다.
   세 가지 기준값을 다시 만들어 내는 계산이므로 근거가 분명하다.

   실제 나이스와 대조해 다른 점이 나오면 이 함수 하나만 고치면 된다. */
const encoder = new TextEncoder();

export function neisByteLength(text: string) {
  /* 줄바꿈은 어떻게 들어오든 엔터 하나로 센다. 붙여넣기로 들어온 CRLF가
     2Byte로 세어지면 같은 글이 편집기마다 다른 길이가 된다. */
  return encoder.encode(text.replace(/\r\n/g, "\n")).length;
}

export const HANGUL_BYTES = 3;

/* 기재요령 [참고자료 8] '학교생활기록부 영역별 입력 가능 최대 글자수'.
   표의 값은 한글 기준 글자 수이므로 Byte로는 세 배다.

   초등학교는 교과학습발달상황·창의적 체험활동·행동특성 및 종합의견에
   글자수 제한이 없다("시스템상 입력 가능한 범위에서 별도의 제한 없음"). */
const LIMIT_CHARS: Record<SchoolLevel, Partial<Record<RecordType, number>>> = {
  elementary: {},
  middle: {
    subject: 500,
    autonomy: 500,
    club: 500,
    career: 500,
    behavior: 300,
  },
  high: {
    subject: 500,
    autonomy: 500,
    club: 500,
    career: 500,
    behavior: 300,
  },
};

/** 나이스가 받는 최대 Byte. 제한이 없는 항목은 null이다. */
export function recordByteLimit(level: SchoolLevel, record: RecordType) {
  const chars = LIMIT_CHARS[level][record];
  return chars === undefined ? null : chars * HANGUL_BYTES;
}

/** Byte를 교사와 모델이 가늠하는 단위(한글 기준 글자 수)로 바꾼다. */
export function hangulCharsFor(bytes: number) {
  return Math.floor(bytes / HANGUL_BYTES);
}

/* 제한이 없는 항목에서도 목표는 있어야 한다. 초등학교 기준값으로 500자를 쓴다. */
const FALLBACK_TARGET_CHARS = 500;

export function defaultTargetBytes(level: SchoolLevel, record: RecordType) {
  return recordByteLimit(level, record) ?? FALLBACK_TARGET_CHARS * HANGUL_BYTES;
}

export type ByteStatus = "empty" | "ok" | "near" | "over";

/* 한도의 90%를 넘으면 미리 알린다. 다 쓰고 나서 넘친 것을 알면 문장을
   다시 짜야 하지만, 가까워질 때 알면 쓰면서 조절할 수 있다. */
const NEAR_RATIO = 0.9;

export function byteStatus(bytes: number, limit: number | null): ByteStatus {
  if (bytes === 0) return "empty";
  if (limit === null) return "ok";
  if (bytes > limit) return "over";
  return bytes >= limit * NEAR_RATIO ? "near" : "ok";
}
