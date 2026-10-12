import { z } from "zod";
import type { Base, ISODate, ISOTime, Settings, Task } from "./types";
import { ADMINS, PRIORITY_ORDER, TASK_CATEGORY_ORDER } from "./defaults";
import { koreaDate } from "./dates";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= "2000-01-01" && v <= "2100-12-31";
}, "올바른 날짜를 입력해주세요.");

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "업무명을 입력해주세요.").max(160),
  category: z.enum(TASK_CATEGORY_ORDER as [Task["category"], ...Task["category"][]]),
  assignee: z.string().trim().max(60).transform(v => v || "미지정"),
  assigneeId: z.enum(["kim", "choi"]).nullable(),
  priority: z.enum(["urgent", "high", "normal", "low"]),
  workDate: date, dueDate: date,
  status: z.enum(["todo", "in_progress", "review", "done"]),
  projectId: z.string().nullable(),
  customerId: z.string().nullable(),
});
export type TaskInput = z.input<typeof taskInputSchema>;
export type TaskView = "today" | "all" | "overdue" | "done";

function defaultFor(settings: Settings, category: Task["category"]) {
  const id = settings.taskCategories.find(c => c.key === category)?.defaultAssigneeId ?? null;
  return { assigneeId: id, assignee: id ? ADMINS[id].name : "미지정" };
}

/** 기존 업무판 규칙: 디자인 완료 → 시공 및 납품, 실측미팅 handoff → 견적 */
export function applyTaskWorkflow(input: TaskInput, previous: Task | null, now: ISOTime, settings: Settings, handoff?: "quote"): Omit<Task, keyof Base> {
  const parsed = taskInputSchema.parse(input);
  const designToOwner = parsed.category === "design" && parsed.status === "done" && !(previous?.category === "design" && previous.status === "done");
  const meetingToQuote = handoff === "quote";
  const next = designToOwner ? { ...parsed, category: "owner" as const, ...defaultFor(settings, "owner"), status: "todo" as const }
    : meetingToQuote ? { ...parsed, category: "estimate" as const, ...defaultFor(settings, "estimate"), status: "todo" as const }
    : parsed;
  return {
    ...next,
    completedAt: next.status === "done" ? previous?.completedAt || now : null,
    designCompletedAt: designToOwner ? now : previous?.designCompletedAt ?? null,
    meetingCompletedAt: meetingToQuote ? now : previous?.meetingCompletedAt ?? null,
  };
}

export function isTaskOverdue(t: Task, today: ISODate) { return t.status !== "done" && t.dueDate < today; }

export function taskSummaries(tasks: Task[], today: ISODate) {
  return {
    today: tasks.filter(t => t.workDate === today && t.status !== "done").length,
    overdue: tasks.filter(t => isTaskOverdue(t, today)).length,
    progressing: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.completedAt && koreaDate(new Date(t.completedAt)) === today).length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "done").length,
  };
}

export function filterTasks(tasks: Task[], view: TaskView, day: ISODate, today: ISODate): Task[] {
  return tasks
    .filter(t => view === "done" ? t.status === "done" : t.status !== "done" && (view === "all" || (view === "today" ? t.workDate === day : isTaskOverdue(t, today))))
    .sort((a, b) => (Number(isTaskOverdue(b, today)) - Number(isTaskOverdue(a, today)))
      || a.dueDate.localeCompare(b.dueDate)
      || PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      || a.createdAt.localeCompare(b.createdAt));
}

export function stageNotes(t: Task): string[] {
  const time = (v: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(v));
  return [t.meetingCompletedAt && `실측미팅 완료 ${time(t.meetingCompletedAt)}`, t.designCompletedAt && `디자인 완료 ${time(t.designCompletedAt)}`].filter((v): v is string => !!v);
}

/**
 * 업무 저장 시 연결 고객 정하기.
 * - 수정 중이고 연결 의뢰가 그대로면 기존 고객 유지(없으면 의뢰의 고객)
 * - 의뢰를 고르거나 바꾸면 그 의뢰의 고객
 * - 의뢰 연결을 끊으면: 기존 고객이 이전 의뢰에서 온 값이면 null, 따로 정한 고객이면 유지
 */
export function resolveTaskCustomerId(projectId: string | null, projects: { id: string; customerId: string }[], task?: Pick<Task, "projectId" | "customerId"> | null): string | null {
  const customerOf = (id: string | null) => (id ? projects.find(p => p.id === id)?.customerId ?? null : null);
  if (task && projectId === task.projectId) return task.customerId ?? customerOf(projectId);
  if (projectId) return customerOf(projectId) ?? task?.customerId ?? null;
  if (!task) return null;
  const prev = customerOf(task.projectId); // 이전 의뢰를 찾지 못하면 고객을 지우지 않는다
  return prev !== null && task.customerId === prev ? null : task.customerId;
}
