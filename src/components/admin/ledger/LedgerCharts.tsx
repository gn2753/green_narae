"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PURCHASE_COLOR, SALES_COLOR } from "./LedgerSummaryCards";

export interface MonthPoint { month: string; sales: number; purchases: number }
export interface CategoryPoint { category: string; amount: number }

const INK = "#1F2A24", MUTED = "#56645C", GRID = "#E3E8E4";

/** 축·라벨용 짧은 금액: 1억 이상은 억, 아니면 만원 단위 */
export function formatShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만`;
  return `${n.toLocaleString("ko-KR")}`;
}
const monthShort = (ym: string) => `${Number(ym.slice(5))}월`;
const monthLong = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5))}월`;

interface TipProps { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }[]; label?: string | number }
function Tip({ active, payload, title, share }: TipProps & { title?: (l: string) => string; share?: (p: Record<string, unknown>) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#D5DDD8] bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-bold text-[#1F2A24]">{title ? title(String(payload[0].payload?.key ?? "")) : ""}</p>
      {payload.map(p => (
        <p key={p.name} className="flex items-center gap-1.5 text-[#1F2A24]">
          <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-[#56645C]">{p.name}</span>
          <span className="ml-auto pl-3 font-bold">{formatWon(p.value ?? 0)}</span>
        </p>
      ))}
      {share && payload[0].payload && <p className="mt-1 text-[#56645C]">{share(payload[0].payload)}</p>}
    </div>
  );
}

function Legend() {
  return (
    <ul className="mb-2 flex items-center gap-4 text-xs text-[#1F2A24]" aria-label="범례">
      <li className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: SALES_COLOR }} />매출</li>
      <li className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: PURCHASE_COLOR }} />매입</li>
    </ul>
  );
}

const th = "px-2 py-1.5 text-left text-xs font-bold text-[#56645C]";
const td = "px-2 py-1.5 text-right tabular-nums";

/** 월별 매출·매입 묶은 막대 + 비용 항목별 비율 가로 막대. `표로 보기`로 같은 값을 표로 본다. */
export function LedgerCharts({ months, categories, monthsNote }: { months: MonthPoint[]; categories: CategoryPoint[]; monthsNote: string }) {
  const [asTable, setAsTable] = useState(false);
  const monthData = months.map(m => ({ ...m, key: m.month, label: monthShort(m.month) }));
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const catData = categories.map(c => ({ ...c, key: c.category, pct: total ? (c.amount / total) * 100 : 0 }));
  const hasMonth = months.some(m => m.sales || m.purchases);

  const toggle = (
    <div role="group" aria-label="보기 방식" className="inline-flex rounded-lg border border-[#D5DDD8] bg-white p-0.5 text-xs font-bold">
      {[false, true].map(t => (
        <button key={String(t)} type="button" aria-pressed={asTable === t} onClick={() => setAsTable(t)}
          className={cn("min-h-11 rounded-md px-3 md:min-h-9", asTable === t ? "bg-[#1F2A24] text-white" : "text-[#3B4A41] hover:bg-[#F6F7F5]")}>{t ? "표로 보기" : "차트"}</button>
      ))}
    </div>
  );

  return (
    <div className="mb-4 grid min-w-0 gap-3 lg:grid-cols-5">
      <section className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4 lg:col-span-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0"><h2 className="text-sm font-bold">월별 매출·매입</h2><p className="text-xs text-[#56645C]">{monthsNote} · 공급가 기준</p></div>
          {toggle}
        </div>
        {asTable ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">월별 매출·매입</caption>
            <thead><tr><th className={th}>월</th><th className={cn(th, "text-right")}>매출</th><th className={cn(th, "text-right")}>매입</th></tr></thead>
            <tbody>{months.map(m => <tr key={m.month} className="border-t border-[#EEF1EF]"><th scope="row" className="px-2 py-1.5 text-left font-medium">{monthLong(m.month)}</th><td className={td}>{formatWon(m.sales)}</td><td className={td}>{formatWon(m.purchases)}</td></tr>)}</tbody></table></div>
        ) : (
          <>
            <Legend />
            {!hasMonth && <p className="py-2 text-sm text-[#56645C]">이 기간에는 매출·매입 내역이 없어요.</p>}
            <div role="img" aria-label={`월별 매출·매입 막대 그래프: ${months.map(m => `${monthLong(m.month)} 매출 ${formatWon(m.sales)} 매입 ${formatWon(m.purchases)}`).join(", ")}`} className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis tickFormatter={formatShort} tickLine={false} axisLine={false} width={56} tick={{ fill: MUTED, fontSize: 12 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#F0F2F1" }} content={<Tip title={k => monthLong(k)} />} />
                  <Bar dataKey="sales" name="매출" fill={SALES_COLOR} maxBarSize={20} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="purchases" name="매입" fill={PURCHASE_COLOR} maxBarSize={20} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4 lg:col-span-2">
        <div className="mb-2 flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-sm font-bold">비용 항목별 비율</h2><p className="text-xs text-[#56645C]">선택한 기간의 매입 · 합계 {formatWon(total)}</p></div></div>
        {catData.length === 0 ? <p className="py-6 text-center text-sm text-[#56645C]">이 기간에는 매입 내역이 없어요.</p>
          : asTable ? (
            <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">비용 항목별 매입</caption>
              <thead><tr><th className={th}>항목</th><th className={cn(th, "text-right")}>금액</th><th className={cn(th, "text-right")}>비율</th></tr></thead>
              <tbody>{catData.map(c => <tr key={c.category} className="border-t border-[#EEF1EF]"><th scope="row" className="px-2 py-1.5 text-left font-medium">{c.category}</th><td className={td}>{formatWon(c.amount)}</td><td className={td}>{c.pct.toFixed(1)}%</td></tr>)}</tbody></table></div>
          ) : (
            <div role="img" aria-label={`비용 항목별 매입 비율: ${catData.map(c => `${c.category} ${c.pct.toFixed(0)}%`).join(", ")}`} className="w-full min-w-0" style={{ height: Math.max(120, catData.length * 40 + 16) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="category" tickLine={false} axisLine={{ stroke: GRID }} width={64} tick={{ fill: INK, fontSize: 12 }} interval={0} />
                  <Tooltip cursor={{ fill: "#F0F2F1" }} content={<Tip title={k => k} share={p => `전체의 ${(p.pct as number).toFixed(1)}%`} />} />
                  <Bar dataKey="amount" name="매입" fill={PURCHASE_COLOR} maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    <LabelList dataKey="amount" position="right" formatter={(v: unknown) => formatShort(Number(v))} fill={INK} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
      </section>
    </div>
  );
}
