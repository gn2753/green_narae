"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMINS } from "@/domain/defaults";
import { EVENT_COLOR, EVENT_KIND_LABEL, type CalendarEventKind } from "@/domain/calendar";
import type { AdminId } from "@/domain/types";
import { cn } from "@/lib/utils";

export type CalendarView = "month" | "week";
export type AdminFilter = AdminId | "all";
const KINDS: CalendarEventKind[] = ["task", "measure", "install", "payment"];

export function CalendarToolbar({ label, view, onView, onPrev, onNext, onToday, admin, onAdmin }: {
  label: string; view: CalendarView; onView: (v: CalendarView) => void;
  onPrev: () => void; onNext: () => void; onToday: () => void; admin: AdminFilter; onAdmin: (a: AdminFilter) => void;
}) {
  const seg = (active: boolean) => cn("inline-flex h-11 items-center gap-1.5 px-3 text-sm md:h-9", active ? "bg-[#2F8F57] font-bold text-white" : "bg-white text-[#3E4A43] hover:bg-[#F6F7F5]");
  return (
    <div className="mb-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-11 md:size-9" onClick={onPrev} aria-label="이전"><ChevronLeft className="size-4" aria-hidden /></Button>
          <Button variant="outline" size="icon" className="size-11 md:size-9" onClick={onNext} aria-label="다음"><ChevronRight className="size-4" aria-hidden /></Button>
          <Button variant="outline" className="h-11 md:h-9" onClick={onToday}>오늘</Button>
        </div>
        <h2 className="mx-1 text-lg font-black text-[#1F2A24]" aria-live="polite">{label}</h2>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-[#D5DCD7]" role="group" aria-label="보기 방식">
          <button type="button" className={seg(view === "month")} aria-pressed={view === "month"} onClick={() => onView("month")}>월</button>
          <button type="button" className={cn(seg(view === "week"), "border-l border-[#D5DCD7]")} aria-pressed={view === "week"} onClick={() => onView("week")}>주</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="담당자 필터">
          {(["all", "kim", "choi"] as const).map(a => (
            <button key={a} type="button" aria-pressed={admin === a} onClick={() => onAdmin(a)}
              className={cn("inline-flex h-11 items-center gap-1.5 rounded-full border px-3 text-sm md:h-8", admin === a ? "border-[#2F8F57] bg-[#E8F5EC] font-bold text-[#1E6E41]" : "border-[#D5DCD7] bg-white text-[#3E4A43]")}>
              {a !== "all" && <span className="size-2.5 rounded-full" style={{ background: ADMINS[a].color }} aria-hidden />}
              {a === "all" ? "전체" : ADMINS[a].name}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5F6B64]" aria-label="범례">
          {KINDS.map(k => (
            <li key={k} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: EVENT_COLOR[k] }} aria-hidden />{EVENT_KIND_LABEL[k]}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
