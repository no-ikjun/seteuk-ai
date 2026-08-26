import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "../icons";

/* 화살표를 직접 그리는 select.
   native select는 WebKit(= Tauri의 macOS 웹뷰)에서 height와 min-height를
   무시해 input보다 낮게 그려진다. `appearance: none`으로 UA 렌더링을 끄면
   높이를 제어할 수 있지만 화살표도 함께 사라지므로 여기서 다시 그린다.

   같이 얻는 것: 화살표가 macOS 기본 이중 꺾쇠가 아니라 앱의 아이콘 세트와
   같은 모양이 되고, currentColor를 쓰므로 다크 모드도 따라온다.
   목록을 여는 동작은 native select 그대로다. */
export function SelectField({
  children,
  ...selectProps
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="selectField">
      <select className="select" {...selectProps}>
        {children}
      </select>
      <ChevronDownIcon className="selectChevron" size={16} />
    </span>
  );
}
