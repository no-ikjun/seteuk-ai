import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  missing?: boolean;
  children: ReactNode;
};

/* 라벨 · 입력 · 설명을 한 덩어리로 묶는다.
   어떤 값을 적어야 하는지 칸마다 한 줄로 말해 주고, 비어서 생성을 막고 있는
   칸은 같은 자리에서 알린다. 버튼만 비활성이고 이유는 보이지 않는 상태를
   만들지 않기 위해서다. */
export function Field({ label, hint, missing, children }: FieldProps) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {missing && <span className="fieldMissing">필요</span>}
      </span>
      {children}
      {hint && <span className="fieldHint">{hint}</span>}
    </label>
  );
}
