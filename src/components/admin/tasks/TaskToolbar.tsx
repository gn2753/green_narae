"use client";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ISODate } from "@/domain/types";
import type { TaskView } from "@/domain/tasks";
import { cn } from "@/lib/utils";

export type AssigneeFilter = "all" | "kim" | "choi" | "other";
const FILTERS: { value: AssigneeFilter; label: string }[] = [
  { value: "all", label: "전체" }, { value: "kim", label: "김자연" }, { value: "choi", label: "최관웅" }, { value: "other", label: "기타" },
];

function Seg<T extends string>({ items, value, onChange, label, kind }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; kind: "tab" | "radio" }) {
  return (
    <div role={kind === "tab" ? "tablist" : "radiogroup"} aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-lg bg-[#EEF1EF] p-0.5">
      {items.map(i => (
        <button key={i.value} type="button" role={kind === "tab" ? "tab" : "radio"}
          aria-selected={kind === "tab" ? value === i.value : undefined} aria-checked={kind === "radio" ? value === i.value : undefined}
          onClick={() => onChange(i.value)}
          className={cn("min-h-10 shrink-0 rounded-md px-3 text-sm whitespace-nowrap md:min-h-8", value === i.value ? "bg-white font-bold text-[#1F2A24] shadow-sm" : "text-[#5F6B64] hover:text-[#1F2A24]")}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

const iconBtn = "inline-flex size-11 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5] md:size-10";

export function TaskToolbar({ view, onView, day, today, onDay, assignee, onAssignee, urgentOnly, onClearUrgent }: {
  view: TaskView; onView: (v: TaskView) => void; day: ISODate; today: ISODate; onDay: (move: { delta: number } | { to: ISODate }) => void;
  assignee: AssigneeFilter; onAssignee: (a: AssigneeFilter) => void; urgentOnly: boolean; onClearUrgent: () => void;
}) {
  const views: { value: TaskView; label: string }[] = [
    { value: "today", label: day === today ? "오늘" : "선택일" }, { value: "all", label: "전체" }, { value: "overdue", label: "지연" }, { value: "done", label: "완료" },
  ];
  return (
    <div className="mb-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Seg items={views} value={view} onChange={onView} label="보기" kind="tab" />
        <Seg items={FILTERS} value={assignee} onChange={onAssignee} label="담당자" kind="radio" />
        {urgentOnly && (
          <button type="button" onClick={onClearUrgent} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#FDECEC] px-3 text-sm font-medium text-[#B42323] md:min-h-8">
            긴급만 보는 중<X className="size-4" aria-hidden /><span className="sr-only">긴급 필터 해제</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" className={iconBtn} aria-label="이전 날짜" onClick={() => onDay({ delta: -1 })}><ChevronLeft className="size-[18px]" /></button>
        <label className="relative inline-flex h-11 items-center gap-1.5 rounded-lg border border-[#D5DDD8] bg-white px-2.5 text-sm md:h-10">
          <CalendarDays className="size-4 text-[#56645C]" aria-hidden />
          <input aria-label="일정 날짜" type="date" min="2000-01-01" max="2100-12-31" value={day} onChange={e => { if (e.target.value) onDay({ to: e.target.value }); }} className="bg-transparent outline-none" />
        </label>
        <button type="button" className={iconBtn} aria-label="다음 날짜" onClick={() => onDay({ delta: 1 })}><ChevronRight className="size-[18px]" /></button>
        <button type="button" onClick={() => onDay({ to: today })} className="inline-flex h-11 items-center rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-medium hover:bg-[#F6F7F5] md:h-10">오늘</button>
      </div>
    </div>
  );
}
