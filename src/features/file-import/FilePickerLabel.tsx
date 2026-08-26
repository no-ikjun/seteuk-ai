import type { ReactNode } from "react";

type FilePickerLabelProps = {
  className: string;
  disabled: boolean;
  onUpload: (file: File) => void;
  children: ReactNode;
};

/* 파일 입력을 감싼 label.
   입력 자체는 화면에서 숨기고 label을 눌러 여는 형태라, 포커스 링은
   App.css의 :focus-within이 label에 그린다. label은 위젯이 아니므로
   비활성 표시는 aria-disabled가 아니라 data-disabled로 한다. */
export function FilePickerLabel({
  className,
  disabled,
  onUpload,
  children,
}: FilePickerLabelProps) {
  return (
    <label className={className} data-disabled={disabled || undefined}>
      <input
        className="visuallyHidden"
        type="file"
        accept=".xlsx,.xls,.csv"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      {children}
    </label>
  );
}
