import { AlertIcon, CheckIcon, CloseIcon } from "../shared/icons";

type ToastStackProps = {
  notice: string;
  error: string;
  onDismissNotice: () => void;
  onDismissError: () => void;
};

/* 알림을 문서 흐름에서 빼내 창 위에 띄운다.
   흐름 안에 두면 알림이 뜨고 사라질 때마다 아래 요소가 밀려 학생 목록과
   편집기의 높이가 바뀐다. 셸 레이아웃에서는 그 변화가 특히 크다.

   알림(성공)은 4초 뒤 스스로 사라지고, 오류는 사용자가 읽고 조치해야 하므로
   닫기 전까지 남는다. 모달보다 위에 둬서 어떤 상황에서도 가려지지 않는다. */
export function ToastStack({
  notice,
  error,
  onDismissNotice,
  onDismissError,
}: ToastStackProps) {
  if (!notice && !error) return null;

  return (
    <div className="toastStack" aria-label="알림">
      {error && (
        <div className="toast error" role="alert">
          <AlertIcon />
          <span className="toastText">{error}</span>
          <button
            className="toastClose"
            type="button"
            aria-label="오류 알림 닫기"
            onClick={onDismissError}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {notice && (
        <div className="toast notice" role="status">
          <CheckIcon />
          <span className="toastText">{notice}</span>
          <button
            className="toastClose"
            type="button"
            aria-label="알림 닫기"
            onClick={onDismissNotice}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
