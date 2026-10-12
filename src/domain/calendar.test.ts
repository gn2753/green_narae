import { describe, it, expect } from "vitest";
import { calendarEvents, monthGrid, addMonths } from "./calendar";
import { weekEvents } from "./dashboard";
import type { Customer, Payment, Project, Task } from "./types";

const B = { createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", version: 1 };
const task = (id: string, workDate: string, assigneeId: "kim" | "choi" = "kim", status: Task["status"] = "todo"): Task => ({ ...B, id, title: `업무${id}`, category: "admin", assignee: "x", assigneeId, priority: "normal", workDate, dueDate: workDate, status, completedAt: null, designCompletedAt: null, meetingCompletedAt: null, projectId: null, customerId: null });
const project = (id: string, status: Project["status"] = "active"): Project => ({ ...B, id, title: `간판${id}`, signType: "채널간판", customerId: "c1", inquiryId: null, stage: "install", assigneeId: "choi", status, waiting: null, taxInvoiceIssued: false,
  stageRecords: { measure: { fields: { measuredAt: "2026-10-12T10:00" }, attachments: [] }, install: { fields: { installedOn: "2026-10-15" }, attachments: [] } } });
const customers: Customer[] = [{ ...B, id: "c1", name: "온담", phone: "010", sites: [] }];
const pay = (id: string, dueDate: string, paidOn: string | null, projectId: string | null = "p1"): Payment => ({ ...B, id, contractId: "k", customerId: "c1", projectId, kind: "balance", amount: 1000000, dueDate, paidOn });

describe("monthGrid", () => {
  const g = monthGrid("2026-10");
  it("42칸, 월요일 시작", () => {
    expect(g).toHaveLength(42);
    expect(g[0]).toBe("2026-09-28");
    expect(g).toContain("2026-10-01");
    expect(g[41]).toBe("2026-11-08");
  });
  it("addMonths 연도 넘김", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("calendarEvents", () => {
  const input = { tasks: [task("1", "2026-10-12"), task("2", "2026-10-20", "choi"), task("3", "2026-10-12", "kim", "done")], projects: [project("p1")], payments: [pay("a", "2026-10-16", null), pay("b", "2026-10-16", "2026-10-10"), pay("c", "2026-10-17", null, null)], customers };
  const r = calendarEvents(input, "2026-10-12", "2026-10-18");
  it("범위 밖·완료·입금 완료 제외", () => {
    expect(r.map(e => e.kind)).toEqual(["task", "measure", "install", "payment", "payment"]);
    expect(r.some(e => e.label === "업무2")).toBe(false);
  });
  it("담당자 매핑", () => {
    expect(r[0].adminId).toBe("kim");
    expect(r[1].adminId).toBe("choi");
    expect(r[3].adminId).toBe("choi");
    expect(r[4].adminId).toBeNull();
    expect(calendarEvents(input, "2026-10-20", "2026-10-20")[0].adminId).toBe("choi");
  });
  it("진행 중이 아닌 의뢰의 실측·시공은 제외", () => {
    const x = calendarEvents({ ...input, projects: [project("p1", "done")] }, "2026-10-12", "2026-10-18");
    expect(x.map(e => e.kind)).toEqual(["task", "payment", "payment"]);
  });
  it("weekEvents와 같은 결과", () => {
    const w = weekEvents(input, "2026-10-12").flatMap(d => d.items.map(i => i.label));
    expect(w).toEqual(r.map(e => e.label));
  });
});
