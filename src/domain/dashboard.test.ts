import { describe, it, expect } from "vitest";
import { weekEvents } from "./dashboard";
import type { Customer, Payment, Project, Task } from "./types";

const B = { createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", version: 1 };
const task = (id: string, workDate: string, status: Task["status"] = "todo"): Task => ({ ...B, id, title: `업무${id}`, category: "admin", assignee: "김자연", assigneeId: "kim", priority: "normal", workDate, dueDate: workDate, status, completedAt: null, designCompletedAt: null, meetingCompletedAt: null, projectId: null, customerId: null });
const project: Project = { ...B, id: "p1", title: "온담카페 간판", signType: "채널간판", customerId: "c1", inquiryId: null, stage: "install", assigneeId: "choi", status: "active", waiting: null, taxInvoiceIssued: false,
  stageRecords: { measure: { fields: { measuredAt: "2026-10-12T10:00" }, attachments: [] }, install: { fields: { installedOn: "2026-10-15" }, attachments: [] } } };
const customers: Customer[] = [{ ...B, id: "c1", name: "온담", phone: "010", sites: [] }];
const pay = (id: string, dueDate: string, paidOn: string | null): Payment => ({ ...B, id, contractId: "k", customerId: "c1", projectId: "p1", kind: "balance", amount: 1000000, dueDate, paidOn });

describe("weekEvents", () => {
  const r = weekEvents({ tasks: [task("1", "2026-10-12"), task("2", "2026-10-12", "done"), task("3", "2026-10-19")], projects: [project], payments: [pay("a", "2026-10-16", null), pay("b", "2026-10-16", "2026-10-10")], customers }, "2026-10-12");
  it("7일을 연속으로 반환", () => {
    expect(r).toHaveLength(7);
    expect(r[0].date).toBe("2026-10-12");
    expect(r[6].date).toBe("2026-10-18");
  });
  it("완료 업무와 주 밖 업무는 제외, 실측은 앞 10자로 매칭", () => {
    expect(r[0].items.map(i => i.kind)).toEqual(["task", "measure"]);
    expect(r[0].items[0].label).toBe("업무1");
  });
  it("시공일과 미입금만 표시", () => {
    expect(r[3].items.map(i => i.kind)).toEqual(["install"]);
    expect(r[4].items.map(i => i.kind)).toEqual(["payment"]);
    expect(r[4].items[0].label).toContain("온담");
  });
});
