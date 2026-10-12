import type { ReactNode } from "react";
import { num, pct } from "./statsShared";

interface Props { today: number; yesterday: number; week: number; prevWeek: number; total: number; totalVisits: number; conversion: number; converted: number }

function Delta({ now, prev, label }: { now: number; prev: number; label: string }) {
  const diff = now - prev;
  const sym = diff > 0 ? "▲" : diff < 0 ? "▼" : "–";
  const word = diff > 0 ? "늘었어요" : diff < 0 ? "줄었어요" : "같아요";
  return (
    <p className="mt-1 text-xs text-[#56645C]">
      {label}{" "}
      <span className={diff > 0 ? "font-bold text-[#25744A]" : diff < 0 ? "font-bold text-[#B3402A]" : "font-bold"}>
        <span aria-hidden>{sym} </span>{num(Math.abs(diff))}명 <span className="sr-only">{word}</span>
      </span>
    </p>
  );
}

function Card({ title, value, unit, children }: { title: string; value: string; unit: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4">
      <p className="text-xs font-bold text-[#56645C]">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1F2A24] md:text-3xl">{value}<span className="ml-0.5 text-sm font-medium text-[#56645C]">{unit}</span></p>
      {children}
    </div>
  );
}

export function StatsSummary({ today, yesterday, week, prevWeek, total, totalVisits, conversion, converted }: Props) {
  return (
    <section aria-label="방문 요약" className="mb-4 grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
      <Card title="오늘 방문자" value={num(today)} unit="명"><Delta now={today} prev={yesterday} label="어제보다" /></Card>
      <Card title="이번 주 (최근 7일)" value={num(week)} unit="명"><Delta now={week} prev={prevWeek} label="지난주보다" /></Card>
      <Card title="전체 방문자" value={num(total)} unit="명"><p className="mt-1 text-xs text-[#56645C]">누적 방문 {num(totalVisits)}회</p></Card>
      <Card title="문의 전환율" value={pct(conversion)} unit=""><p className="mt-1 text-xs text-[#56645C]">누적 기준 · 방문 {num(totalVisits)}회 중 문의 완료 {num(converted)}회</p></Card>
    </section>
  );
}
