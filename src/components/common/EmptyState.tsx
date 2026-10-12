import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** lucide 아이콘 컴포넌트(예: `Inbox`) */
  icon: LucideIcon;
  /** 한 줄 안내(예: "등록된 고객이 없어요") */
  title: ReactNode;
  /** 보조 설명 */
  description?: ReactNode;
  /** 등록 버튼 등(선택) */
  action?: ReactNode;
  className?: string;
}

/** 목록이 비었을 때 보여주는 안내 상자(점선 테두리 · 가운데 정렬). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D5DDD8] bg-white/70 px-6 py-12 text-center", className)}>
      <span className="mb-1 inline-flex size-12 items-center justify-center rounded-full bg-[#E8F3EC] text-brand">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="text-base font-bold text-[#1F2A24]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[#5F6B64]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
