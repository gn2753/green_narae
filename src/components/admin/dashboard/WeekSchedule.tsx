import Link from "next/link";
import type { WeekDay } from "@/domain/dashboard";
import type { ISODate } from "@/domain/types";
import { cn } from "@/lib/utils";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dow = (d: ISODate) => DOW[new Date(`${d}T12:00:00Z`).getUTCDay()];
const md = (d: ISODate) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

function Chip({ e }: { e: WeekDay["items"][number] }) {
  return (
    <Link href={e.href} className="flex min-h-11 items-center gap-1.5 rounded-md bg-[#F6F7F5] px-2 py-1 text-xs text-[#1F2A24] hover:bg-[#EEF1EF] md:min-h-7">
      <span className="size-2 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
      <span className="min-w-0 truncate">{e.label}</span>
    </Link>
  );
}

/** 이번 주(월~일) 일정. 데스크톱·태블릿은 7칸, 모바일은 오늘부터 세로 목록. */
export function WeekSchedule({ days, today }: { days: WeekDay[]; today: ISODate }) {
  const upcoming = days.filter(d => d.date >= today);
  return (
    <section aria-labelledby="week" className="rounded-xl border border-[#E3E8E4] bg-white p-3.5">
      <h2 id="week" className="mb-2 text-sm font-bold text-[#1F2A24]">이번 주 일정</h2>
      <div className="hidden grid-cols-7 gap-1.5 md:grid">
        {days.map(d => (
          <div key={d.date} className={cn("min-h-28 min-w-0 rounded-lg border p-1.5", d.date === today ? "border-[#2F8F57] bg-[#F1F9F4]" : "border-[#EEF1EF]")}>
            <p className={cn("mb-1 text-xs font-bold", d.date === today ? "text-[#1E6E41]" : "text-[#5F6B64]")}>{dow(d.date)} {md(d.date)}</p>
            <div className="flex flex-col gap-1">{d.items.map((e, i) => <Chip key={i} e={e} />)}</div>
          </div>
        ))}
      </div>
      <ul className="md:hidden">
        {upcoming.map(d => (
          <li key={d.date} className={cn("border-t border-[#EEF1EF] py-2 first:border-t-0", d.date === today && "rounded-lg bg-[#F1F9F4] px-2")}>
            <p className={cn("mb-1 text-xs font-bold", d.date === today ? "text-[#1E6E41]" : "text-[#5F6B64]")}>{d.date === today ? "오늘 · " : ""}{dow(d.date)}요일 {md(d.date)}</p>
            {d.items.length === 0 ? <p className="text-xs text-[#9AA59F]">일정 없음</p> : <div className="flex flex-col gap-1">{d.items.map((e, i) => <Chip key={i} e={e} />)}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
