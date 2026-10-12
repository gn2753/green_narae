import Link from "next/link";
import { ADMINS } from "@/domain/defaults";
import type { CalendarEvent } from "@/domain/calendar";
import { cn } from "@/lib/utils";

/** 일정 한 줄: 종류 색 점 + 라벨 + 담당자 색 점. 클릭하면 해당 화면으로 이동. */
export function EventChip({ e, compact }: { e: CalendarEvent; compact?: boolean }) {
  return (
    <Link href={e.href} className={cn("flex items-center gap-1.5 rounded-md bg-[#F6F7F5] px-2 py-1 text-xs text-[#1F2A24] hover:bg-[#EEF1EF]", compact ? "min-h-6" : "min-h-11 md:min-h-8")}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{e.label}</span>
      {e.adminId && <span className="size-2 shrink-0 rounded-full" style={{ background: ADMINS[e.adminId].color }} title={ADMINS[e.adminId].name} aria-label={ADMINS[e.adminId].name} />}
    </Link>
  );
}
