"use client";
import { monthGrid, type CalendarEvent } from "@/domain/calendar";
import type { ISODate } from "@/domain/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EventChip } from "./EventChip";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];
const md = (d: ISODate) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;
const MAX = 3;

/** 월 보기: 데스크톱·태블릿은 칸마다 최대 3개 + "+N"(그날 목록 팝오버), 모바일은 점 + 아래 선택일 목록. */
export function MonthView({ month, events, today, selected, onSelect }: {
  month: string; events: CalendarEvent[]; today: ISODate; selected: ISODate; onSelect: (d: ISODate) => void;
}) {
  const days = monthGrid(month);
  const on = (d: ISODate) => events.filter(e => e.date === d);
  const selEvents = on(selected);
  return (
    <section aria-label="월 일정">
      <div className="overflow-hidden rounded-xl border border-[#E3E8E4] bg-white">
        <div className="grid grid-cols-7 border-b border-[#EEF1EF] bg-[#F6F7F5]">
          {DOW.map((n, i) => <div key={n} className={cn("py-1.5 text-center text-xs font-bold", i === 6 ? "text-[#D64545]" : "text-[#5F6B64]")}>{n}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map(d => {
            const evs = on(d), inMonth = d.startsWith(month), isToday = d === today;
            const num = Number(d.slice(8, 10));
            return (
              <div key={d} className={cn("min-w-0 border-b border-r border-[#EEF1EF] [&:nth-child(7n)]:border-r-0", !inMonth && "bg-[#FAFBFA]")}>
                <button type="button" onClick={() => onSelect(d)} aria-pressed={d === selected} aria-label={`${md(d)} 일정 ${evs.length}건`}
                  className={cn("flex h-14 w-full flex-col items-center gap-1 pt-1.5 md:hidden", d === selected && "bg-[#E8F5EC]")}>
                  <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", isToday && "bg-[#2F8F57] font-bold text-white", !inMonth && !isToday && "text-[#B5BEB8]")}>{num}</span>
                  <span className="flex gap-0.5">{evs.slice(0, 3).map((e, i) => <span key={i} className="size-1.5 rounded-full" style={{ background: e.color }} />)}</span>
                </button>
                <div className="hidden min-h-28 p-1 md:block">
                  <p className={cn("mb-1 flex size-6 items-center justify-center rounded-full text-xs", isToday ? "bg-[#2F8F57] font-bold text-white" : inMonth ? "text-[#3E4A43]" : "text-[#B5BEB8]")}>{num}</p>
                  <div className="flex flex-col gap-0.5">
                    {evs.slice(0, MAX).map((e, i) => <EventChip key={i} e={e} compact />)}
                    {evs.length > MAX && (
                      <Popover>
                        <PopoverTrigger className="h-6 rounded-md px-2 text-left text-xs font-bold text-[#1E6E41] hover:bg-[#E8F5EC]" aria-label={`${md(d)} 일정 ${evs.length - MAX}건 더 보기`}>+{evs.length - MAX}</PopoverTrigger>
                        <PopoverContent align="start" className="w-72">
                          <p className="text-sm font-bold text-[#1F2A24]">{md(d)} 일정 {evs.length}건</p>
                          <div className="flex flex-col gap-1">{evs.map((e, i) => <EventChip key={i} e={e} />)}</div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-[#E3E8E4] bg-white p-3 md:hidden">
        <p className="mb-2 text-sm font-bold text-[#1F2A24]">{md(selected)}{selected === today ? " (오늘)" : ""}</p>
        {selEvents.length === 0 ? <p className="text-xs text-[#9AA59F]">일정 없음</p> : <div className="flex flex-col gap-1">{selEvents.map((e, i) => <EventChip key={i} e={e} />)}</div>}
      </div>
    </section>
  );
}
