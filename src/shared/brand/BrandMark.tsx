/* 세특척척 로고.
   public/brand/seeteuk-cheokcheok-icon-detailed.svg와 같은 도형이며, 한쪽을
   고치면 다른 쪽도 함께 고친다. 파일을 <img>로 불러오지 않고 컴포넌트로 두는
   이유는 기록장 획이 네이비 고정색이라 다크 모드 배경에 묻히기 때문이다.
   획 색만 --brand-ink 토큰으로 빼고, 체크 두 개는 두 모드 모두에서 읽히므로
   브랜드 원색을 유지한다. */
import { useId } from "react";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

export function BrandMark({ size = 32, className }: BrandMarkProps) {
  /* <defs>의 id는 문서 전역이라 컴포넌트를 두 번 그리면 충돌한다. */
  const checkId = `${useId()}-check`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path
          id={checkId}
          d="M342 612
             C378 614 413 640 440 670
             C447 679 453 676 458 662
             C510 558 628 348 734 274
             C741 268 750 269 755 276
             C760 283 758 291 750 298
             C656 376 548 592 490 702
             C478 720 458 728 439 722
             C421 716 409 703 398 690
             C380 669 360 654 338 646
             C328 642 323 632 326 623
             C329 616 335 612 342 612Z"
        />
      </defs>

      <g
        transform="translate(-16 44)"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M806 104C686 102 588 118 512 226C412 118 282 82 144 90C108 92 88 116 88 152V696C88 733 109 754 146 752C292 740 418 766 512 846C568 796 628 770 698 768"
          stroke="var(--brand-ink)"
          strokeWidth="48"
        />
        <path
          d="M212 306H394M212 420H394M212 534H354"
          stroke="var(--brand-ink)"
          strokeWidth="36"
        />
        <use href={`#${checkId}`} fill="var(--brand-blue)" />
        <use
          href={`#${checkId}`}
          transform="translate(235 -2)"
          fill="var(--brand-mint)"
        />
      </g>
    </svg>
  );
}
