"use client";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import type { ISODate, Project, Settings, Task, TaskCategory, TaskStatus } from "@/domain/types";
import type { TaskView } from "@/domain/tasks";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";

const EMPTY: Record<"overdue" | "done" | "other", { title: string; description: string }> = {
  overdue: { title: "지연된 업무가 없습니다", description: "마감이 지난 업무가 여기에 표시됩니다." },
  done: { title: "완료한 업무가 없습니다", description: "완료 처리한 업무를 여기에서 확인하세요." },
  other: { title: "등록된 업무가 없습니다", description: "업무를 등록하고 일정을 시작하세요." },
};

export function TaskLane({ category, icon: Icon, info, tasks, view, today, loading, busyIds, projects, className, onAdd, onEdit, onStatus, onToQuote }: {
  category: TaskCategory; icon: LucideIcon; info: Settings["taskCategories"][number]; tasks: Task[]; view: TaskView; today: ISODate; loading: boolean;
  busyIds: Set<string>; projects: Map<string, Project>; className?: string;
  onAdd: (c: TaskCategory) => void; onEdit: (t: Task) => void; onStatus: (t: Task, s: TaskStatus) => void; onToQuote: (t: Task) => void;
}) {
  const empty = EMPTY[view === "overdue" ? "overdue" : view === "done" ? "done" : "other"];
  return (
    <section aria-label={info.label} className={cn("flex min-w-0 flex-col rounded-xl border border-[#E3E8E4] bg-[#EEF1EF]/60", className)}>
      <header className="flex items-start gap-2.5 p-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand"><Icon className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-base font-bold text-[#1F2A24]">{info.label}
            <span className="rounded-full bg-white px-2 text-xs font-medium text-[#56645C]" aria-label={`${tasks.length}건`}>{loading ? "—" : tasks.length}</span>
          </h3>
          <p className="text-xs text-[#5F6B64]">{info.description}</p>
        </div>
        <button type="button" onClick={() => onAdd(category)} aria-label={`${info.label} 등록`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#3B4A41] hover:bg-white md:size-9"><Plus className="size-5" /></button>
      </header>
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {loading ? (
          <div className="space-y-2.5" aria-label="업무 불러오는 중">{[0, 1].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-white" />)}</div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={Icon} title={empty.title} description={empty.description} className="py-8"
            action={view !== "overdue" && view !== "done" ? (
              <button type="button" onClick={() => onAdd(category)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-medium hover:bg-[#F6F7F5] md:min-h-9"><Plus className="size-4" />{info.label} 등록</button>
            ) : undefined} />
        ) : tasks.map(t => (
          <TaskCard key={t.id} task={t} today={today} busy={busyIds.has(t.id)} project={t.projectId ? projects.get(t.projectId) : undefined} onEdit={onEdit} onStatus={onStatus} onToQuote={onToQuote} />
        ))}
      </div>
    </section>
  );
}
