"use client";
import Link from "next/link";
import { CalendarDays, Calculator, LoaderCircle, Pencil, UserRound } from "lucide-react";
import type { ISODate, Project, Task, TaskStatus } from "@/domain/types";
import { PRIORITY_LABEL } from "@/domain/defaults";
import { isTaskOverdue, stageNotes } from "@/domain/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { cn } from "@/lib/utils";
import { TaskSelect } from "./TaskSelect";
import { statusOptions } from "./taskForm";

const PRIORITY_TONE: Record<Task["priority"], StatusTone> = { urgent: "red", high: "yellow", normal: "gray", low: "blue" };
export const shortDate = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8))}일`;

export function TaskCard({ task: t, today, busy, project, onEdit, onStatus, onToQuote }: {
  task: Task; today: ISODate; busy: boolean; project?: Project;
  onEdit: (t: Task) => void; onStatus: (t: Task, s: TaskStatus) => void; onToQuote: (t: Task) => void;
}) {
  const overdue = isTaskOverdue(t, today), done = t.status === "done";
  const notes = stageNotes(t);
  return (
    <article className={cn("rounded-xl border bg-white p-3", overdue ? "border-[#F0B7B7]" : "border-[#E3E8E4]", done && "bg-[#F6F7F5]")}>
      <div className="flex items-center gap-1.5">
        <StatusBadge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</StatusBadge>
        {overdue && <StatusBadge tone="red" dot>마감 지연</StatusBadge>}
        <button type="button" onClick={() => onEdit(t)} disabled={busy} aria-label={`${t.title} 수정`}
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-[#56645C] hover:bg-[#EEF1EF] disabled:opacity-50 md:min-h-8">
          <Pencil className="size-3.5" aria-hidden /><span>수정</span>
        </button>
      </div>
      <div className="mt-1 flex items-start gap-1">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9">
          <Checkbox checked={done} disabled={busy} onCheckedChange={v => onStatus(t, v === true ? "done" : "todo")}
            aria-label={`${t.title} ${done ? "완료 취소" : t.category === "design" ? "디자인 완료 및 시공으로 이동" : "완료 처리"}`} />
        </label>
        <button type="button" onClick={() => onEdit(t)} disabled={busy}
          className={cn("min-h-11 min-w-0 flex-1 py-2 text-left text-[15px] leading-snug font-bold break-words text-[#1F2A24] md:min-h-9 md:py-1.5", done && "text-[#7A867F] line-through")}>
          {t.title}
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#56645C]">
        {t.assigneeId ? <AdminAvatar id={t.assigneeId} size="xs" withName /> : <span className="inline-flex items-center gap-1"><UserRound className="size-4" aria-hidden />{t.assignee}</span>}
        <span>일정 {shortDate(t.workDate)}</span>
      </div>
      {notes.length > 0 && <div className="mt-2 space-y-0.5 rounded-lg bg-[#E8F3EC] px-2.5 py-1.5 text-xs text-[#1E6E41]">{notes.map(n => <p key={n}>{n}</p>)}</div>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 text-sm", overdue ? "font-bold text-[#B42323]" : "text-[#56645C]")}>
          <CalendarDays className="size-3.5" aria-hidden />{t.dueDate === today ? "오늘 마감" : `${shortDate(t.dueDate)} 마감`}
        </span>
        <TaskSelect label={`${t.title} 진행 상태`} value={t.status} options={statusOptions(t.category)} disabled={busy} onChange={v => onStatus(t, v as TaskStatus)} className="h-11 w-auto min-w-28 md:h-8" />
      </div>
      {t.category === "design" && !done && <p className="mt-2 text-xs text-[#5F6B64]">완료 처리하면 시공 및 납품으로 이동</p>}
      {t.category === "meeting" && (
        <button type="button" onClick={() => onToQuote(t)} disabled={busy} aria-label={`${t.title} 실측미팅 완료 후 견적으로 보내기`}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-[#E8F3EC] text-sm font-bold text-[#1E6E41] hover:bg-[#DCEEE3] disabled:opacity-50 md:min-h-9">
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Calculator className="size-4" aria-hidden />}미팅 완료·견적으로 보내기
        </button>
      )}
      {t.projectId && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#EEF1EF] pt-2 text-xs text-[#5F6B64]">
          <span className="min-w-0 truncate">{project ? `의뢰: ${project.title}` : "연결된 의뢰"}</span>
          <Link href={`/admin/projects?id=${t.projectId}`} className="inline-flex min-h-11 shrink-0 items-center font-bold text-brand hover:underline md:min-h-7">의뢰 보기</Link>
        </div>
      )}
    </article>
  );
}
