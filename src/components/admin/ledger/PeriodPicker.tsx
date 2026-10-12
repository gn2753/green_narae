"use client";
import { PERIOD_LABEL, PERIOD_ORDER, type PeriodKind } from "@/domain/ledgerPeriod";
import type { ISODate } from "@/domain/types";
import { DateField } from "@/components/common/DateField";
import { cn } from "@/lib/utils";

/** 기간 선택: 이번 달 / 지난 달 / 이번 분기 / 올해 / 직접(시작~끝) */
export function PeriodPicker({ kind, from, to, onKind, onCustom }: {
  kind: PeriodKind; from: ISODate; to: ISODate; onKind: (k: PeriodKind) => void; onCustom: (from: ISODate | "", to: ISODate | "") => void;
}) {
  return (
    <div className="mb-4 space-y-2">
      <div role="group" aria-label="기간 선택" className="flex flex-wrap gap-1.5">
        {PERIOD_ORDER.map(k => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => onKind(k)}
            className={cn("inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-bold md:min-h-9", kind === k ? "border-brand bg-brand text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5]")}>
            {PERIOD_LABEL[k]}
          </button>
        ))}
      </div>
      {kind === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <DateField aria-label="시작일" value={from} max={to} onChange={v => onCustom(v, to)} className="w-auto" />
          <span aria-hidden className="text-[#7A867F]">~</span>
          <DateField aria-label="종료일" value={to} min={from} onChange={v => onCustom(from, v)} className="w-auto" />
        </div>
      ) : (
        <p className="text-sm text-[#56645C]">{from} ~ {to}</p>
      )}
    </div>
  );
}
