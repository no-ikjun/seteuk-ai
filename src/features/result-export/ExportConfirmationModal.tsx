type ExportConfirmationModalProps = {
  incompleteCount: number;
  unreviewedCount: number;
  untouchedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ExportConfirmationModal({
  incompleteCount,
  unreviewedCount,
  untouchedCount,
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

        {/* 「학교생활기록 작성 및 관리지침」 기재요령은 생성형 AI의 결과를
            서술형 항목에 그대로 입력하는 행위를 금지하고, 보조 수단으로 쓸
            때에도 입력 전에 교사가 확인하도록 정하고 있다. */}
        {untouchedCount > 0 && (
          <p>
            생성된 문장을 한 번도 고치지 않은 학생이{" "}
            <b>{untouchedCount}명</b> 있습니다. 학교생활기록부 기재요령은 AI가
            생성한 자료를 서술형 항목에 그대로 입력하는 것을 금지합니다. 학생의
            실제 수행과 다른 내용은 없는지 확인하고 선생님의 표현으로 고쳐
            주세요.
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
