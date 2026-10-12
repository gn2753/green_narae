import { describe, it, expect } from "vitest";
import { applyTaskWorkflow, filterTasks, resolveTaskCustomerId, isTaskOverdue, taskSummaries, taskInputSchema, type TaskInput } from "./tasks";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Task } from "./types";

const NOW = "2026-10-11T01:00:00.000Z";
const base: TaskInput = { title: "온담카페 시안", category: "design", assignee: "김자연", assigneeId: "kim", priority: "normal", workDate: "2026-10-11", dueDate: "2026-10-12", status: "todo", projectId: null, customerId: null };
const task = (over: Partial<Task>): Task => ({ id: "t", createdAt: NOW, updatedAt: NOW, version: 1, completedAt: null, designCompletedAt: null, meetingCompletedAt: null, ...base, assignee: "김자연", ...over } as Task);

describe("applyTaskWorkflow", () => {
  it("디자인 완료 시 시공 및 납품으로 인계 (담당 최관웅, 예정)", () => {
    const r = applyTaskWorkflow({ ...base, status: "done" }, task({}), NOW, DEFAULT_SETTINGS);
    expect(r.category).toBe("owner");
    expect(r.assigneeId).toBe("choi");
    expect(r.assignee).toBe("최관웅");
    expect(r.status).toBe("todo");
    expect(r.designCompletedAt).toBe(NOW);
    expect(r.completedAt).toBeNull();
  });
  it("이미 디자인 완료였던 업무는 다시 인계하지 않는다", () => {
    const prev = task({ status: "done", completedAt: NOW });
    const r = applyTaskWorkflow({ ...base, status: "done" }, prev, NOW, DEFAULT_SETTINGS);
    expect(r.category).toBe("design");
  });
  it("실측미팅 → 견적 인계(handoff=quote)", () => {
    const input: TaskInput = { ...base, category: "meeting", assignee: "최관웅", assigneeId: "choi" };
    const r = applyTaskWorkflow(input, task({ category: "meeting" }), NOW, DEFAULT_SETTINGS, "quote");
    expect(r.category).toBe("estimate");
    expect(r.assigneeId).toBe("kim");
    expect(r.meetingCompletedAt).toBe(NOW);
  });
  it("완료 처리 시 completedAt 기록, 완료 취소 시 null", () => {
    const done = applyTaskWorkflow({ ...base, category: "admin", status: "done" }, null, NOW, DEFAULT_SETTINGS);
    expect(done.completedAt).toBe(NOW);
    const undone = applyTaskWorkflow({ ...base, category: "admin", status: "todo" }, task({ category: "admin", status: "done", completedAt: NOW }), NOW, DEFAULT_SETTINGS);
    expect(undone.completedAt).toBeNull();
  });
});

describe("taskInputSchema", () => {
  it("업무명 필수, 잘못된 날짜 거부", () => {
    expect(taskInputSchema.safeParse({ ...base, title: " " }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...base, dueDate: "2026-02-30" }).success).toBe(false);
  });
  it("담당자 빈칸은 '미지정'", () => {
    expect(taskInputSchema.parse({ ...base, assignee: "", assigneeId: null }).assignee).toBe("미지정");
  });
});

describe("filter / summaries", () => {
  const today = "2026-10-11";
  const list = [
    task({ id: "a", workDate: today, dueDate: today }),
    task({ id: "b", workDate: "2026-10-09", dueDate: "2026-10-10", priority: "urgent" }),
    task({ id: "c", workDate: today, dueDate: today, status: "done", completedAt: "2026-10-11T02:00:00.000Z" }),
    task({ id: "d", workDate: "2026-10-15", dueDate: "2026-10-16", status: "in_progress" }),
  ];
  it("지연 판정", () => { expect(isTaskOverdue(list[1], today)).toBe(true); expect(isTaskOverdue(list[0], today)).toBe(false); });
  it("뷰별 필터", () => {
    expect(filterTasks(list, "today", today, today).map(t => t.id)).toEqual(["a"]);
    expect(filterTasks(list, "overdue", today, today).map(t => t.id)).toEqual(["b"]);
    expect(filterTasks(list, "done", today, today).map(t => t.id)).toEqual(["c"]);
    expect(filterTasks(list, "all", today, today).map(t => t.id)).toEqual(["b", "a", "d"]); // 지연 먼저, 마감일 순
  });
  it("요약", () => { expect(taskSummaries(list, today)).toEqual({ today: 1, overdue: 1, progressing: 1, completed: 1, urgent: 1 }); });
});

describe("resolveTaskCustomerId", () => {
  const projects = [{ id: "p1", customerId: "c1" }, { id: "p2", customerId: "c2" }];
  it("의뢰 없는 업무를 수정해도 고객을 지우지 않는다", () => {
    expect(resolveTaskCustomerId(null, projects, { projectId: null, customerId: "c9" })).toBe("c9");
  });
  it("의뢰가 그대로면 기존 고객 유지, 비어 있으면 의뢰의 고객", () => {
    expect(resolveTaskCustomerId("p1", projects, { projectId: "p1", customerId: "c5" })).toBe("c5");
    expect(resolveTaskCustomerId("p1", projects, { projectId: "p1", customerId: null })).toBe("c1");
  });
  it("의뢰를 고르거나 바꾸면 그 의뢰의 고객", () => {
    expect(resolveTaskCustomerId("p2", projects, { projectId: "p1", customerId: "c1" })).toBe("c2");
    expect(resolveTaskCustomerId("p1", projects, null)).toBe("c1");
    expect(resolveTaskCustomerId("p1", [], null)).toBeNull(); // 의뢰 목록을 아직 못 불러온 경우
  });
  it("의뢰 연결을 끊으면 의뢰에서 온 고객만 지운다", () => {
    expect(resolveTaskCustomerId(null, projects, { projectId: "p1", customerId: "c1" })).toBeNull();
    expect(resolveTaskCustomerId(null, projects, { projectId: "p1", customerId: "c7" })).toBe("c7");
    expect(resolveTaskCustomerId(null, projects, null)).toBeNull();
  });
});
