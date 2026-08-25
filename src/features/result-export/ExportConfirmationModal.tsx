type ExportConfirmationModalProps = {
  incompleteCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ExportConfirmationModal({
  incompleteCount,
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
        <p>
          결과가 없는 학생이 <b>{incompleteCount}명</b> 있습니다. 해당 학생은 결과
          칸을 비운 채 엑셀 파일에 포함됩니다.
        </p>
        <p className="muted">현재까지 작성된 결과만 저장하시겠습니까?</p>
        <div className="row gap modalActions">
          <button className="btn primary" type="button" onClick={onConfirm}>
            빈 결과를 포함해 저장
          </button>
          <button className="btn" type="button" onClick={onCancel}>
            취소
          </button>
        </div>
      </section>
    </div>
  );
}
