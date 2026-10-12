import type { AdminId, Customer, ISODate, Payment, Project, Task } from "./types";
import { addDays, startOfWeek } from "./dates";
import { formatWon } from "@/lib/format";

export type CalendarEventKind = "task" | "measure" | "install" | "payment";
export interface CalendarEvent { date: ISODate; kind: CalendarEventKind; label: string; href: string; color: string; adminId: AdminId | null }
export interface CalendarInput { tasks: Task[]; projects: Project[]; payments: Payment[]; customers: Customer[] }

export const EVENT_COLOR: Record<CalendarEventKind, string> = { task: "#6B7A72", measure: "#E9A23B", install: "#2F8F57", payment: "#D64545" };
export const EVENT_KIND_LABEL: Record<CalendarEventKind, string> = { task: "업무", measure: "실측", install: "시공", payment: "입금 예정" };

const dateOf = (v: unknown): ISODate | null => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

/**
 * from~to(양끝 포함) 일정: 미완료 업무(workDate) · 진행 중 의뢰의 실측일/시공일 · 미입금 예정일.
 * 날짜 오름차순, 같은 날은 업무 → 실측/시공 → 입금 순서.
 */
export function calendarEvents(input: CalendarInput, from: ISODate, to: ISODate): CalendarEvent[] {
  const inRange = (d: ISODate | null): d is ISODate => !!d && d >= from && d <= to;
  const customerName = (id: string) => input.customers.find(c => c.id === id)?.name ?? "고객";
  const projectAssignee = (id: string | null) => (id ? input.projects.find(p => p.id === id)?.assigneeId ?? null : null);
  const out: CalendarEvent[] = [];
  for (const t of input.tasks) {
    if (t.status !== "done" && inRange(t.workDate)) out.push({ date: t.workDate, kind: "task", label: t.title, href: `/admin/tasks?id=${t.id}`, color: EVENT_COLOR.task, adminId: t.assigneeId });
  }
  for (const p of input.projects) {
    if (p.status !== "active") continue;
    const m = dateOf(p.stageRecords.measure?.fields.measuredAt);
    if (inRange(m)) out.push({ date: m, kind: "measure", label: `실측 · ${p.title}`, href: `/admin/projects?id=${p.id}`, color: EVENT_COLOR.measure, adminId: p.assigneeId });
    const i = dateOf(p.stageRecords.install?.fields.installedOn);
    if (inRange(i)) out.push({ date: i, kind: "install", label: `시공 · ${p.title}`, href: `/admin/projects?id=${p.id}`, color: EVENT_COLOR.install, adminId: p.assigneeId });
  }
  for (const pay of input.payments) {
    if (!pay.paidOn && inRange(pay.dueDate)) out.push({ date: pay.dueDate, kind: "payment", label: `입금 · ${customerName(pay.customerId)} ${formatWon(pay.amount)}`, href: `/admin/payments?id=${pay.id}`, color: EVENT_COLOR.payment, adminId: projectAssignee(pay.projectId) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date)); // 안정 정렬: 같은 날은 위 순서 유지
}

/** 월요일 시작 6주x7일 (42칸). month: "YYYY-MM" */
export function monthGrid(month: string): ISODate[] {
  const start = startOfWeek(`${month}-01`);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** "YYYY-MM"에 n개월을 더한다. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}
