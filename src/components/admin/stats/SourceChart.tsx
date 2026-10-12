import { VISIT_SOURCE_LABEL } from "@/domain/defaults";
import type { VisitSource } from "@/domain/types";
import { STAT_GREEN, num, pct } from "./statsShared";

export interface BreakRow { key: string; visitors: number; share: number }
const ORDER = Object.keys(VISIT_SOURCE_LABEL) as VisitSource[];

/** 유입 경로 7분류 가로 막대(값이 0인 분류도 표시). */
export function SourceChart({ rows }: { rows: BreakRow[] }) {
  const by = new Map(rows.map(r => [r.key, r]));
  const items = ORDER.map(k => ({ key: k, visitors: by.get(k)?.visitors ?? 0, share: by.get(k)?.share ?? 0 })).sort((a, b) => b.visitors - a.visitors);
  const max = Math.max(1, ...items.map(i => i.visitors));
  return (
    <section className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4">
      <h2 className="text-sm font-bold">유입 경로</h2>
      <p className="mb-3 text-xs text-[#56645C]">최근 90일 · 방문자가 어디서 들어왔는지</p>
      <ul className="space-y-2.5">
        {items.map(i => (
          <li key={i.key} title={`${VISIT_SOURCE_LABEL[i.key]} ${num(i.visitors)}명 (${pct(i.share)})`}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm"><span className="min-w-0 truncate">{VISIT_SOURCE_LABEL[i.key]}</span><span className="whitespace-nowrap tabular-nums"><span className="font-bold">{num(i.visitors)}명</span><span className="ml-1 text-xs text-[#56645C]">{pct(i.share)}</span></span></div>
            <div className="h-2.5 rounded-full bg-[#EEF1EF]" aria-hidden><div className="h-2.5 rounded-full" style={{ width: `${(i.visitors / max) * 100}%`, background: STAT_GREEN }} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
