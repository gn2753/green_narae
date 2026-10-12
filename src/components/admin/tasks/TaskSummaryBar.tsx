"use client";
import { AlertCircle, CircleCheck, Clock3, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Summary { today: number; overdue: number; progressing: number; completed: number }

function Card({ label, value, hint, icon: Icon, onClick, selected, tone }: {
  label: string; value: number | null; hint: string; icon: typeof ListTodo; onClick?: () => void; selected?: boolean; tone?: "red";
}) {
  const body = (
    <>
      <span className="flex items-center justify-between text-sm font-medium text-[#56645C]">{label}<Icon className={cn("size-5", tone === "red" ? "text-[#D64545]" : "text-brand")} aria-hidden /></span>
      <span className={cn("mt-1 block text-3xl font-black tracking-tight", tone === "red" && value ? "text-[#B42323]" : "text-[#1F2A24]")}>{value ?? "—"}<small className="ml-0.5 text-sm font-medium text-[#7A867F]">건</small></span>
      <span className="mt-0.5 block text-xs text-[#7A867F]">{hint}</span>
    </>
  );
  const cls = cn("block rounded-xl border bg-white p-3.5 text-left", selected ? "border-brand ring-2 ring-brand/20" : "border-[#E3E8E4]");
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={selected} className={cn(cls, "min-h-11 hover:border-brand/60")}>{body}</button>
    : <div className={cls}>{body}</div>;
}

/** 요약 4카드: 앞 두 개는 눌러서 보기를 바꾼다. */
export function TaskSummaryBar({ summary, loaded, todaySelected, overdueSelected, onToday, onOverdue }: {
  summary: Summary; loaded: boolean; todaySelected: boolean; overdueSelected: boolean; onToday: () => void; onOverdue: () => void;
}) {
  const v = (n: number) => (loaded ? n : null);
  return (
    <section aria-label="오늘 업무 요약" className="mb-4 grid grid-cols-2 gap-2.5 md:mb-5 md:gap-3 xl:grid-cols-4">
      <Card label="오늘 할 일" value={v(summary.today)} hint="오늘 일정 중 미완료 업무" icon={ListTodo} onClick={onToday} selected={todaySelected} />
      <Card label="지연 업무" value={v(summary.overdue)} hint="마감일이 지난 미완료 업무" icon={AlertCircle} onClick={onOverdue} selected={overdueSelected} tone="red" />
      <Card label="진행 중" value={v(summary.progressing)} hint="전체 업무의 진행 현황" icon={Clock3} />
      <Card label="오늘 완료" value={v(summary.completed)} hint="오늘 완료 처리한 업무" icon={CircleCheck} />
    </section>
  );
}
