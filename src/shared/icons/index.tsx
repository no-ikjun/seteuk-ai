/* 화면에서 쓰는 아이콘.
   로고와 같은 규격으로 그린다: 24 그리드, 라운드 캡·조인, 획 1.75.
   아이콘 라이브러리를 의존성으로 추가하지 않는 이유는
   docs/roadmap/phase-7-brand-and-workspace.md 2단계에 적어 뒀다.

   모두 stroke에 currentColor를 쓰므로 색은 부모의 color로 정한다.
   장식 요소라 aria-hidden이며, 의미는 항상 옆의 글자가 전한다. */
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};

function Icon({
  size = 16,
  children,
  className,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </Icon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="16.25" cy="7.75" r="3.5" />
      <path d="M13.8 10.2 4.5 19.5" />
      <path d="M7.5 16.5 9.9 18.9" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 4.4 2.6 17.9a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.75v3.75" />
      <path d="M12 17.25h.01" />
    </Icon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15.5V3.5" />
      <path d="M7.5 8 12 3.5 16.5 8" />
      <path d="M4 14.5v3.75A2.25 2.25 0 0 0 6.25 20.5h11.5A2.25 2.25 0 0 0 20 18.25V14.5" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v12" />
      <path d="M7.5 11 12 15.5 16.5 11" />
      <path d="M4 14.5v3.75A2.25 2.25 0 0 0 6.25 20.5h11.5A2.25 2.25 0 0 0 20 18.25V14.5" />
    </Icon>
  );
}

export function SheetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.75 2.75H7.5A2.25 2.25 0 0 0 5.25 5v14A2.25 2.25 0 0 0 7.5 21.25h9A2.25 2.25 0 0 0 18.75 19V7.75Z" />
      <path d="M13.75 2.75v5h5" />
      <path d="M8.5 12.75h6.5" />
      <path d="M8.5 16.5h6.5" />
      <path d="M11.75 12.75v7.5" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 4.5 12.7 9.3 17.5 11 12.7 12.7 11 17.5 9.3 12.7 4.5 11 9.3 9.3Z" />
      <path d="M18 16v3.5" />
      <path d="M16.25 17.75h3.5" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 8.75h8A2.25 2.25 0 0 1 20.25 11v8A2.25 2.25 0 0 1 18 21.25h-8A2.25 2.25 0 0 1 7.75 19v-8A2.25 2.25 0 0 1 10 8.75Z" />
      <path d="M4.75 15.25A2.25 2.25 0 0 1 3.5 13.25V5A2.25 2.25 0 0 1 5.75 2.75H14A2.25 2.25 0 0 1 16 4" />
    </Icon>
  );
}

export function RetryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.5 4v4.5H16" />
    </Icon>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.25" y="6.25" width="11.5" height="11.5" rx="2.75" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 9.5 12 16l6.5-6.5" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icon>
  );
}
