import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 상태 색: green 완료·정상 · yellow 대기·주의 · red 지연·미수 · gray 보류·기타 · blue 진행·안내 */
export type StatusTone = "green" | "yellow" | "red" | "gray" | "blue";

const TONE: Record<StatusTone, { box: string; dot: string }> = {
  green: { box: "bg-[#E3F4E9] text-[#1E6E41]", dot: "bg-[#2F8F57]" },
  yellow: { box: "bg-[#FFF4D6] text-[#8A6400]", dot: "bg-[#E0A800]" },
  red: { box: "bg-[#FDECEC] text-[#B42323]", dot: "bg-[#D64545]" },
  gray: { box: "bg-[#EEF1EF] text-[#56645C]", dot: "bg-[#9AA59F]" },
  blue: { box: "bg-[#E6EEF7] text-[#2D4A6E]", dot: "bg-[#3D5A80]" },
};

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  /** 글자 앞에 작은 색 점 표시 */
  dot?: boolean;
  className?: string;
}

/** 작은 알약 모양 상태 표시(글자 + 색). 색만으로 뜻을 전하지 않도록 항상 글자를 넣는다. */
export function StatusBadge({ tone, children, dot, className }: StatusBadgeProps) {
  const t = TONE[tone];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium", t.box, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden />}
      {children}
    </span>
  );
}
