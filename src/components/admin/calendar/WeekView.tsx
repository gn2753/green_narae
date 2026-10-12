"use client";
import { addDays } from "@/domain/dates";
import type { CalendarEvent } from "@/domain/calendar";
import type { ISODate } from "@/domain/types";
import { cn } from "@/lib/utils";
import { EventChip } from "./EventChip";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dow = (d: ISODate) => DOW[new Date(`${d}T12:00:00Z`).getUTCDay()];
const md = (d: ISODate) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

/** 주 보기: 데스크톱·태블릿은 7칸, 모바일은 세로 목록. */
export function WeekView({ weekStart, events, today }: { weekStart: ISODate; events: CalendarEvent[]; today: ISODate }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const on = (d: ISODate) => events.filter(e => e.date === d);
  return (
    <section aria-label="주 일정" className="rounded-xl border border-[#E3E8E4] bg-white p-3">
      <div className="hidden grid-cols-7 gap-1.5 md:grid">
        {days.map(d => (
          <div key={d} className={cn("min-h-48 min-w-0 rounded-lg border p-1.5", d === today ? "border-[#2F8F57] bg-[#F1F9F4]" : "border-[#EEF1EF]")}>
            <p className={cn("mb-1 text-xs font-bold", d === today ? "text-[#1E6E41]" : "text-[#5F6B64]")}>{dow(d)} {md(d)}</p>
            <div className="flex flex-col gap-1">{on(d).map((e, i) => <EventChip key={i} e={e} compact />)}</div>
          </div>
        ))}
      </div>
      <ul className="md:hidden">
        {days.map(d => (
          <li key={d} className={cn("border-t border-[#EEF1EF] py-2 first:border-t-0", d === today && "rounded-lg bg-[#F1F9F4] px-2")}>
            <p className={cn("mb-1 text-xs font-bold", d === today ? "text-[#1E6E41]" : "text-[#5F6B64]")}>{d === today ? "오늘 · " : ""}{dow(d)}요일 {md(d)}</p>
            {on(d).length === 0 ? <p className="text-xs text-[#9AA59F]">일정 없음</p> : <div className="flex flex-col gap-1">{on(d).map((e, i) => <EventChip key={i} e={e} />)}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
