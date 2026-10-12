"use client";
import type { LedgerSummary } from "@/domain/money";
import { cn } from "@/lib/utils";
import { formatWon } from "@/lib/format";

export const SALES_COLOR = "#2F8F57";
export const PURCHASE_COLOR = "#E07A5F";

function Card({ label, swatch, value, sub, negative }: { label: string; swatch?: string; value: string; sub?: string; negative?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl border bg-white p-3 md:p-4", negative ? "border-[#F4C9C9] bg-[#FDECEC]" : "border-[#E3E8E4]")}>
      <p className={cn("flex items-center gap-1.5 text-xs", negative ? "text-[#B42323]" : "text-[#5F6B64]")}>
        {swatch && <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: swatch }} />}{label}
      </p>
      <p className={cn("mt-1 break-words text-lg font-black md:text-xl", negative && "text-[#B42323]")}>{value}</p>
      {sub && <p className={cn("mt-0.5 text-xs", negative ? "text-[#B42323]" : "text-[#5F6B64]")}>{sub}</p>}
    </div>
  );
}

/** 매출·매입·차액(이익)·건수 카드. 금액은 공급가 기준. */
export function LedgerSummaryCards({ summary, salesCount, purchaseCount }: { summary: LedgerSummary; salesCount: number; purchaseCount: number }) {
  const loss = summary.diff < 0;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="매출" swatch={SALES_COLOR} value={formatWon(summary.sales)} sub="공급가 기준" />
      <Card label="매입" swatch={PURCHASE_COLOR} value={formatWon(summary.purchases)} sub="공급가 기준" />
      <Card label={loss ? "차액 (적자)" : "차액 (이익)"} value={`${loss ? "-" : ""}${formatWon(Math.abs(summary.diff))}`} negative={loss} sub="매출 − 매입" />
      <Card label="거래 건수" value={`${salesCount + purchaseCount}건`} sub={`매출 ${salesCount}건 · 매입 ${purchaseCount}건`} />
    </div>
  );
}
