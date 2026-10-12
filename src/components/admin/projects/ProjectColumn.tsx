"use client";
import { forwardRef, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { StageKey } from "@/domain/types";
import { cn } from "@/lib/utils";

/** 보드의 단계 열(놓기 대상). `highlight`면 ?stage= 딥링크로 강조. */
export const ProjectColumn = forwardRef<HTMLElement, {
  stage: StageKey; label: string; color: string; count: number; highlight?: boolean; loading?: boolean; className?: string; children: ReactNode;
}>(function ProjectColumn({ stage, label, color, count, highlight, loading, className, children }, ref) {
  const { setNodeRef, isOver, active } = useDroppable({ id: stage });
  const fromOther = !!active && active.data.current?.stage !== stage;
  return (
    <section ref={ref} aria-label={`${label} ${count}건`} data-stage={stage}
      className={cn("flex min-w-0 flex-col rounded-2xl bg-[#EEF1EF]/70 p-2 transition-shadow md:min-h-[420px]",
        highlight && "ring-2 ring-offset-2 ring-offset-[#F6F7F5]", className)}
      style={highlight ? { ["--tw-ring-color" as string]: color } : undefined}>
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
        <h2 className="min-w-0 truncate text-sm font-bold text-[#1F2A24]">{label}</h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#56645C]">{loading ? "—" : count}</span>
      </header>
      <div ref={setNodeRef}
        className={cn("flex flex-1 flex-col gap-2 rounded-xl p-0.5 transition-colors", isOver && fromOther && "bg-white/80 outline-2 outline-dashed outline-offset-2")}
        style={isOver && fromOther ? { outlineColor: color } : undefined}>
        {children}
      </div>
    </section>
  );
});
