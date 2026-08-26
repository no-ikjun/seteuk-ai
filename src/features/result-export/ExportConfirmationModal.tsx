type ExportConfirmationModalProps = {
  incompleteCount: number;
  unreviewedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ExportConfirmationModal({
  incompleteCount,
  unreviewedCount,
  onConfirm,
  onCancel,
}: ExportConfirmationModalProps) {
  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="card modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-confirmation-title"
      >
        <h2 id="export-confirmation-title">결과 내보내기 확인</h2>

        {incompleteCount > 0 && (
          <p>
            결과가 없는 학생이 <b>{incompleteCount}명</b> 있습니다. 해당 학생은
            결과 칸을 비운 채 엑셀 파일에 포함됩니다.
          </p>
        )}

        {/* 초안을 아직 읽지 않은 학생이 남아 있는지 저장 직전에 알린다. */}
        {unreviewedCount > 0 && (
          <p>
            아직 검토 완료로 표시하지 않은 초안이 <b>{unreviewedCount}명</b>{" "}
            있습니다. 생성 결과는 초안이므로 저장 전에 사실관계와 표현을
            확인해주세요.
          </p>
        )}

        <p className="muted">현재까지 작성된 결과를 저장하시겠습니까?</p>
        <div className="row gap modalActions">
          <button className="btn primary" type="button" onClick={onConfirm}>
            지금 상태로 저장
          </button>
          <button className="btn" type="button" onClick={onCancel}>
            취소
          </button>
        </div>
      </section>
    </div>
  );
}
