import type { GenerationTarget } from "../../app/useSeeteukApp";

type SendConfirmationModalProps = {
  target: GenerationTarget;
  model: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const TARGET_LABEL: Record<GenerationTarget, string> = {
  current: "현재 학생",
  all: "결과가 없는 모든 학생",
  selected: "선택한 학생",
  failed: "실패한 학생",
};

export function SendConfirmationModal({
  target,
  model,
  onConfirm,
  onCancel,
}: SendConfirmationModalProps) {
  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="card modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-confirmation-title"
      >
        <h2 id="send-confirmation-title">OpenAI 전송 전 확인</h2>
        <p>
          {TARGET_LABEL[target]}의 활동 기록, 교사 추가 키워드, 프로젝트 설정과
          예시 글이 <b>{model}</b> 모델로 전송됩니다.
        </p>
        <p className="muted">
          표시용 이름 컬럼은 제외되며 요청에는 저장 비활성화 옵션(store: false)을
          적용합니다. 아래 활동 미리보기가 실제 학생별 전송 내용입니다.
        </p>
        <div className="row gap modalActions">
          <button className="btn primary" type="button" onClick={onConfirm}>
            확인하고 생성
          </button>
          <button className="btn" type="button" onClick={onCancel}>
            취소
          </button>
        </div>
      </section>
    </div>
  );
}
