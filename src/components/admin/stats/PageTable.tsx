"use client";
import { useState } from "react";
import { useIsMobile } from "@/components/common/useIsMobile";
import { STAT_GREEN, num, pageName, pct } from "./statsShared";

export interface PageRow { key: string; visitors: number; share: number }
const MOBILE_LIMIT = 5;

/** 페이지별 방문자: 이름·경로·막대 비율. 모바일은 상위 5개 + 더보기. */
export function PageTable({ rows }: { rows: PageRow[] }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const shown = isMobile && !open ? rows.slice(0, MOBILE_LIMIT) : rows;
  const hidden = rows.length - shown.length;
  return (
    <section className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4">
      <h2 className="text-sm font-bold">페이지별 방문자</h2>
      <p className="mb-2 text-xs text-[#56645C]">최근 90일 · 한 방문자가 여러 페이지를 보면 각각 셉니다</p>
      {rows.length === 0 ? <p className="py-3 text-sm text-[#56645C]">아직 방문 기록이 없어요.</p> : (
        <table className="w-full text-sm"><caption className="sr-only">페이지별 방문자</caption>
          <thead><tr className="text-left text-xs text-[#56645C]"><th className="py-1.5 pr-2 font-bold">페이지</th><th className="w-[34%] py-1.5 pr-2 font-bold md:w-[40%]"><span className="sr-only">비율</span></th><th className="py-1.5 text-right font-bold">방문자</th></tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.key} className="border-t border-[#EEF1EF] align-middle">
                <th scope="row" className="min-w-0 py-2 pr-2 text-left font-medium"><span className="block">{pageName(r.key)}</span><span className="block break-all text-xs font-normal text-[#7A867F]">{r.key}</span></th>
                <td className="py-2 pr-2"><div className="h-2 rounded-full bg-[#EEF1EF]" aria-hidden><div className="h-2 rounded-full" style={{ width: `${Math.max(2, r.share * 100)}%`, background: STAT_GREEN }} /></div></td>
                <td className="whitespace-nowrap py-2 text-right tabular-nums"><span className="font-bold">{num(r.visitors)}명</span><span className="ml-1 text-xs text-[#56645C]">{pct(r.share)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isMobile && rows.length > MOBILE_LIMIT && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#D5DDD8] text-sm font-bold text-[#3B4A41] hover:bg-[#F6F7F5]">
          {open ? "접기" : `더보기 (${hidden}개)`}
        </button>
      )}
    </section>
  );
}
