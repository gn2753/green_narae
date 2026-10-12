import { cn } from "@/lib/utils";

/** 메뉴 옆 숫자 배지(0이면 그리지 않음, 99 초과는 "99+") */
export function CountBadge({ count, className, label = "미답변" }: { count: number; className?: string; label?: string }) {
  if (count <= 0) return null;
  return (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold leading-none text-white", className)}>
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
