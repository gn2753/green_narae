"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Calculator, HardHat, Hourglass, Paintbrush, Plus, Ruler, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { DEFAULT_SETTINGS, TASK_CATEGORY_ORDER } from "@/domain/defaults";
import { addDays, koreaDate } from "@/domain/dates";
import { filterTasks, taskSummaries, type TaskView } from "@/domain/tasks";
import type { ISODate, Task, TaskCategory, TaskStatus } from "@/domain/types";
import { saveTask } from "@/services/taskService";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { cn } from "@/lib/utils";
import { a02TabItems } from "./A02Tabs";
import { TaskDialog } from "./TaskDialog";
import { TaskLane } from "./TaskLane";
import { TaskSummaryBar } from "./TaskSummaryBar";
import { TaskToolbar, type AssigneeFilter } from "./TaskToolbar";
import { QUOTE_MESSAGE, savedMessage, taskToInput } from "./taskForm";

const ICONS: Record<TaskCategory, LucideIcon> = { design: Paintbrush, meeting: Ruler, owner: HardHat, estimate: Calculator, waiting: Hourglass, admin: BriefcaseBusiness };
const VIEWS: TaskView[] = ["today", "all", "overdue", "done"];

function dateLabel(day: ISODate) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Seoul" }).format(new Date(`${day}T12:00:00+09:00`));
}

/** A02-① 파트별 업무 보드. 보기·긴급 필터·등록/수정 다이얼로그는 주소 쿼리(`?view=` `?priority=urgent` `?new=1` `?id=`)로 열린다. */
export function TaskBoard() {
  const repo = useRepo();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const today = useToday();
  const { items: tasks, loading } = useCollection("tasks");
  const { items: projects } = useCollection("projects");
  const { run } = useMutation();

  const [day, setDay] = useState<ISODate>(() => koreaDate());
  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [mobileCat, setMobileCat] = useState<TaskCategory>("design");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const urgentOnly = params.get("priority") === "urgent";
  const rawView = params.get("view");
  const view: TaskView = VIEWS.includes(rawView as TaskView) ? (rawView as TaskView) : urgentOnly ? "all" : "today";
  const editId = params.get("id");
  const editing = editId ? tasks.find(t => t.id === editId) : undefined;
  const isNew = params.get("new") === "1";
  const newCat = TASK_CATEGORY_ORDER.find(c => c === params.get("category")) ?? "design";
  const dialogOpen = isNew || !!editing;

  const go = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const setView = (v: TaskView) => go({ view: v === "today" ? null : v });
  const moveDay = (m: { delta: number } | { to: ISODate }) => { setDay("delta" in m ? addDays(day, m.delta) : m.to); if (view !== "today") go({ view: null }); };
  const closeDialog = (open: boolean) => { if (!open) go({ new: null, id: null, category: null }); };
  const openNew = (c: TaskCategory) => go({ new: "1", id: null, category: c });
  const openEdit = (t: Task) => go({ id: t.id, new: null, category: null });

  const summary = taskSummaries(tasks, today);
  const visible = useMemo(() => {
    const list = filterTasks(tasks, view, day, today)
      .filter(t => !urgentOnly || t.priority === "urgent")
      .filter(t => assignee === "all" || (assignee === "other" ? t.assigneeId === null : t.assigneeId === assignee));
    return list;
  }, [tasks, view, day, today, urgentOnly, assignee]);
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const totalDay = tasks.filter(t => t.workDate === day).length;
  const doneDay = tasks.filter(t => t.workDate === day && t.status === "done").length;
  const pageTitle = view === "today" ? (day === today ? "오늘의 업무" : "선택일 업무") : view === "overdue" ? "지연 업무" : view === "done" ? "완료한 업무" : "전체 업무";

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    if (busyIds.has(id) || !admin) return;
    setBusyIds(s => new Set(s).add(id));
    try { await fn(); } finally { setBusyIds(s => { const n = new Set(s); n.delete(id); return n; }); }
  };
  const updateStatus = (t: Task, status: TaskStatus) => withBusy(t.id, async () => {
    const input = { ...taskToInput(t), status };
    const saved = await run(() => saveTask(repo, input, t, admin!.id));
    if (saved) toast.success(saved.category !== t.category ? savedMessage(input, saved, true) : status === "done" ? "업무를 완료했습니다." : "진행 상태를 변경했습니다.");
  });
  const toQuote = (t: Task) => withBusy(t.id, async () => {
    const saved = await run(() => saveTask(repo, taskToInput(t), t, admin!.id, "quote"));
    if (saved) toast.success(QUOTE_MESSAGE);
  });

  const laneProps = { today, loading, busyIds, projects: projectMap, view, onAdd: openNew, onEdit: openEdit, onStatus: updateStatus, onToQuote: toQuote };

  return (
    <>
      <PageHeader
        title="업무·일정" description={<>{dateLabel(today)} <span className="text-[#7A867F]">한국 시간 기준</span></>}
        tabs={a02TabItems("tasks")}
        actions={<button type="button" onClick={() => openNew(TASK_CATEGORY_ORDER.includes(mobileCat) ? mobileCat : "design")} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"><Plus className="size-4" aria-hidden />업무 등록</button>}
      />
      <TaskSummaryBar summary={summary} loaded={!loading}
        todaySelected={view === "today" && day === today} overdueSelected={view === "overdue"}
        onToday={() => { setDay(today); setView("today"); }} onOverdue={() => setView("overdue")} />
      <section aria-label="업무 일정">
        <div className="mb-2 flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-[#1F2A24]">{pageTitle}</h2>
          <span className="text-sm text-[#56645C]">{loading ? "—" : visible.length}건</span>
        </div>
        <TaskToolbar view={view} onView={setView} day={day} today={today} onDay={moveDay} assignee={assignee} onAssignee={setAssignee}
          urgentOnly={urgentOnly} onClearUrgent={() => go({ priority: null })} />
        {view === "today" && !loading && totalDay > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-[#56645C] ring-1 ring-[#E3E8E4]">
            <span>{dateLabel(day)} · {totalDay}건 중 {doneDay}건 완료</span><span className="font-bold text-[#1E6E41]">{Math.round(doneDay / totalDay * 100)}%</span>
          </div>
        )}
        <div className="mb-3 flex gap-1.5 overflow-x-auto md:hidden" role="tablist" aria-label="업무 파트">
          {settings.taskCategories.map(c => {
            const n = visible.filter(t => t.category === c.key).length;
            return (
              <button key={c.key} type="button" role="tab" aria-selected={mobileCat === c.key} onClick={() => setMobileCat(c.key)}
                className={cn("inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm whitespace-nowrap", mobileCat === c.key ? "border-brand bg-brand font-bold text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41]")}>
                {c.label}<span className={cn("text-xs", mobileCat === c.key ? "text-white/90" : "text-[#7A867F]")}>{loading ? "" : n}</span>
              </button>
            );
          })}
        </div>
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TASK_CATEGORY_ORDER.map(category => {
            const info = settings.taskCategories.find(c => c.key === category);
            if (!info) return null;
            return <TaskLane key={category} category={category} icon={ICONS[category]} info={info} tasks={visible.filter(t => t.category === category)}
              className={mobileCat === category ? "" : "max-md:hidden"} {...laneProps} />;
          })}
        </div>
      </section>
      <TaskDialog open={dialogOpen} task={editing} defaultCategory={newCat} defaultDate={day} onOpenChange={closeDialog} />
    </>
  );
}
