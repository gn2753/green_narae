"use client";
import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/domain/defaults";
import type { OrderStatus } from "@/domain/types";
import { cn } from "@/lib/utils";

/** 발주 상태 스텝. 다음 단계만 누를 수 있다(되돌리기는 수정 폼에서). */
export function OrderStatusStepper({ status, onAdvance, disabled, compactBelowXl, className }: { status: OrderStatus; onAdvance: (next: OrderStatus) => void; disabled?: boolean; compactBelowXl?: boolean; className?: string }) {
  const cur = ORDER_STATUS_ORDER.indexOf(status);
  const next = ORDER_STATUS_ORDER[cur + 1];
  const base = "inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-bold";
  const nextBtn = (s: OrderStatus) => (
    <button type="button" disabled={disabled} onClick={() => onAdvance(s)} aria-label={`${ORDER_STATUS_LABEL[s]}(으)로 변경`}
      className={cn(base, "min-h-11 border border-dashed border-[#2F8F57] bg-white px-3 text-[#1E6E41] hover:bg-[#F1F8F3] disabled:opacity-50 md:min-h-8")}>{ORDER_STATUS_LABEL[s]}</button>
  );
  return (
    <>
      {compactBelowXl && (
        <div className={cn("flex items-center gap-1 whitespace-nowrap xl:hidden", className)} role="group" aria-label="발주 상태">
          <span aria-current="step" className={cn(base, status === "received" ? "bg-[#E6F3EA] text-[#1E6E41]" : "bg-brand text-white")}>{ORDER_STATUS_LABEL[status]}</span>
          {next && <><span aria-hidden className="text-[#9AA59F]">→</span>{nextBtn(next)}</>}
        </div>
      )}
    <ol className={cn("flex flex-wrap items-center gap-1", compactBelowXl && "hidden xl:flex", className)} aria-label="발주 상태">
      {ORDER_STATUS_ORDER.map((s, i) => {
        if (i < cur) return <li key={s}><span className={cn(base, "bg-[#E6F3EA] text-[#1E6E41]")}><Check className="size-3" aria-hidden />{ORDER_STATUS_LABEL[s]}</span></li>;
        if (i === cur) return <li key={s}><span aria-current="step" className={cn(base, "bg-brand text-white")}>{ORDER_STATUS_LABEL[s]}</span></li>;
        if (i === cur + 1) return <li key={s}>{nextBtn(s)}</li>;
        return <li key={s}><span className={cn(base, "bg-[#F0F2F1] text-[#9AA59F]")}>{ORDER_STATUS_LABEL[s]}</span></li>;
      })}
    </ol>
    </>
  );
}
