"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { GRID, MUTED, STAT_GREEN, num } from "./statsShared";

export type StatsRange = 7 | 30 | 90;
export const RANGES: StatsRange[] = [7, 30, 90];
export interface DayPoint { date: string; visitors: number }

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const longDate = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일 (${DOW[new Date(`${d}T00:00:00Z`).getUTCDay()]})`;

function Tip({ active, payload }: { active?: boolean; payload?: { payload?: DayPoint }[] }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="rounded-lg border border-[#D5DDD8] bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-[#1F2A24]">{longDate(p.date)}</p>
      <p className="text-[#1F2A24]"><span aria-hidden className="mr-1.5 inline-block size-2.5 rounded-sm align-middle" style={{ background: STAT_GREEN }} />방문자 <span className="font-bold">{num(p.visitors)}명</span></p>
    </div>
  );
}

/** 일별 방문자 막대. 7·30·90일 토글, `표로 보기`. */
export function DailyChart({ data, range, onRange }: { data: DayPoint[]; range: StatsRange; onRange: (r: StatsRange) => void }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(0, ...data.map(d => d.visitors));
  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.visitors, 0) / data.length) : 0;
  const seg = "inline-flex rounded-lg border border-[#D5DDD8] bg-white p-0.5 text-xs font-bold";
  const segBtn = (on: boolean) => cn("min-h-11 rounded-md px-3 md:min-h-9", on ? "bg-[#1F2A24] text-white" : "text-[#3B4A41] hover:bg-[#F6F7F5]");
  return (
    <section className="mb-4 min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h2 className="text-sm font-bold">일별 방문자</h2><p className="text-xs text-[#56645C]">최근 {range}일 · 하루 평균 {num(avg)}명 · 최고 {num(max)}명</p></div>
        <div className="flex flex-wrap gap-2">
          <div role="group" aria-label="기간" className={seg}>
            {RANGES.map(r => <button key={r} type="button" aria-pressed={range === r} onClick={() => onRange(r)} className={segBtn(range === r)}>{r}일</button>)}
          </div>
          <div role="group" aria-label="보기 방식" className={seg}>
            {[false, true].map(t => <button key={String(t)} type="button" aria-pressed={asTable === t} onClick={() => setAsTable(t)} className={segBtn(asTable === t)}>{t ? "표로 보기" : "차트"}</button>)}
          </div>
        </div>
      </div>
      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm"><caption className="sr-only">일별 방문자</caption>
            <thead><tr><th className="px-2 py-1.5 text-left text-xs font-bold text-[#56645C]">날짜</th><th className="px-2 py-1.5 text-right text-xs font-bold text-[#56645C]">방문자</th></tr></thead>
            <tbody>{[...data].reverse().map(d => <tr key={d.date} className="border-t border-[#EEF1EF]"><th scope="row" className="px-2 py-1.5 text-left font-medium">{longDate(d.date)}</th><td className="px-2 py-1.5 text-right tabular-nums">{num(d.visitors)}명</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={`최근 ${range}일 일별 방문자 막대 그래프. 하루 평균 ${avg}명, 최고 ${max}명`} className="h-56 w-full min-w-0 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={range === 90 ? "10%" : "25%"}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tickFormatter={md} tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: MUTED, fontSize: 12 }} minTickGap={range === 7 ? 4 : 24} interval={range === 7 ? 0 : "preserveStartEnd"} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fill: MUTED, fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F0F4F1" }} />
              <Bar dataKey="visitors" name="방문자" fill={STAT_GREEN} radius={range === 90 ? [1, 1, 0, 0] : [4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
