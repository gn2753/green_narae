"use client";
import { Check } from "lucide-react";
import { STAGE_ORDER, stageColor, stageLabel } from "@/domain/defaults";
import type { Settings, StageKey } from "@/domain/types";
import { cn } from "@/lib/utils";

/** 의뢰 단계 표시줄: 현재 단계 강조, 지난 단계 체크. 누르면 그 단계 기록을 연다(단계 이동이 아님). */
export function StageStepper({ settings, current, selected, onSelect }: {
  settings: Settings; current: StageKey; selected: StageKey; onSelect: (k: StageKey) => void;
}) {
  const ci = STAGE_ORDER.indexOf(current);
  return (
    <ol className="flex items-start" aria-label="의뢰 단계 (누르면 단계별 기록)">
      {STAGE_ORDER.map((k, i) => {
        const color = stageColor(settings, k);
        const past = i < ci, now = i === ci, sel = k === selected;
        return (
          <li key={k} className="relative min-w-0 flex-1">
            {i > 0 && <span aria-hidden className="absolute top-[22px] right-1/2 left-[-50%] h-0.5" style={{ background: i <= ci ? stageColor(settings, STAGE_ORDER[i - 1]) : "#DDE3DF" }} />}
            <button type="button" onClick={() => onSelect(k)} aria-pressed={sel}
              aria-label={`${stageLabel(settings, k)}${now ? " (현재 단계)" : past ? " (지난 단계)" : ""} 기록 보기`}
              className={cn("relative flex w-full flex-col items-center gap-1 rounded-lg px-0.5 pt-1.5 pb-1 text-center", sel && "bg-[#EEF1EF]")}>
              <span className={cn("flex size-8 items-center justify-center rounded-full border-2 text-xs font-black", now && "ring-4 ring-offset-0")}
                style={{
                  borderColor: past || now ? color : "#C9D1CC",
                  background: now ? color : past ? "#fff" : "#fff",
                  color: now ? "#fff" : past ? color : "#7A867F",
                  ...(now ? { ["--tw-ring-color" as string]: `${color}33` } : {}),
                }}>
                {past ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("w-full text-[11px] leading-tight break-keep md:text-xs", now ? "font-black text-[#1F2A24]" : "text-[#5F6B64]", sel && "underline underline-offset-2")}>{stageLabel(settings, k)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
