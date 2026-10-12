import { describe, it, expect } from "vitest";
import { buildSeed } from "./seed";
import { isTaskOverdue } from "@/domain/tasks";
import { paymentStatus } from "@/domain/money";
import { DEFAULT_SETTINGS, TASK_CATEGORY_ORDER } from "@/domain/defaults";

describe("buildSeed", () => {
  const today = "2026-10-11";
  const s = buildSeed(today);
  const c = s.collections;
  it("spec §9 개수", () => {
    expect(c.customers).toHaveLength(14); expect(c.inquiries).toHaveLength(12); expect(c.projects).toHaveLength(12);
    expect(c.tasks).toHaveLength(26); expect(c.contracts).toHaveLength(9); expect(c.payments).toHaveLength(16);
    expect(c.vendors).toHaveLength(6); expect(c.orders).toHaveLength(10); expect(c.portfolios).toHaveLength(12); expect(c.news).toHaveLength(6);
    expect(c.ledger.length).toBeGreaterThanOrEqual(50);
  });
  it("매입매출 최근 6개월, 매출 > 매입", () => {
    const sum = (t: string) => c.ledger.filter(l => l.type === t).reduce((a, l) => a + l.amount, 0);
    expect(sum("sale")).toBeGreaterThan(sum("purchase"));
    expect(new Set(c.ledger.map(l => l.date.slice(0, 7))).size).toBe(6);
    expect(c.ledger.every(l => l.date <= today)).toBe(true);
  });
  it("문의 상태 분포 4/6/2, NEW 2건 이상", () => {
    const by = (st: string) => c.inquiries.filter(i => i.status === st).length;
    expect([by("open"), by("answered"), by("closed")]).toEqual([4, 6, 2]);
    expect(c.inquiries.filter(i => i.isNew).length).toBeGreaterThanOrEqual(2);
  });
  it("업무는 6파트 모두, 지연 2건 이상", () => {
    expect(new Set(c.tasks.map(t => t.category))).toEqual(new Set(TASK_CATEGORY_ORDER));
    expect(c.tasks.filter(t => isTaskOverdue(t, today)).length).toBeGreaterThanOrEqual(2);
  });
  it("미수 2건, 공개 포트폴리오 10건, 방문 기록 90일", () => {
    expect(c.payments.filter(p => paymentStatus(p, today) === "overdue")).toHaveLength(2);
    expect(c.portfolios.filter(p => p.published)).toHaveLength(10);
    expect(new Set(c.visits.map(v => v.date)).size).toBe(90);
  });
  it("모든 참조가 존재한다", () => {
    const ids = (xs: { id: string }[]) => new Set(xs.map(x => x.id));
    const cu = ids(c.customers), pr = ids(c.projects), ve = ids(c.vendors), co = ids(c.contracts);
    c.projects.forEach(p => expect(cu.has(p.customerId)).toBe(true));
    c.orders.forEach(o => { expect(ve.has(o.vendorId)).toBe(true); if (o.projectId) expect(pr.has(o.projectId)).toBe(true); });
    c.payments.forEach(p => expect(co.has(p.contractId)).toBe(true));
    c.activities.forEach(a => expect(pr.has(a.projectId)).toBe(true));
    c.tasks.forEach(t => { if (t.projectId) expect(pr.has(t.projectId)).toBe(true); });
    c.inquiries.forEach(q => { if (q.customerId) expect(cu.has(q.customerId)).toBe(true); if (q.projectId) expect(pr.has(q.projectId)).toBe(true); });
  });
  it("결정적이다(같은 날짜 → 같은 결과)", () => { expect(JSON.stringify(buildSeed(today))).toBe(JSON.stringify(s)); });
  it("설정은 DEFAULT_SETTINGS의 복사본이며 관리자 방문자를 제외한다", () => {
    expect(s.settings).not.toBe(DEFAULT_SETTINGS);
    expect(s.settings.stages).not.toBe(DEFAULT_SETTINGS.stages);
    expect(s.settings.excludedVisitorIds).toEqual(expect.arrayContaining(["admin-kim", "admin-choi"]));
    expect(DEFAULT_SETTINGS.excludedVisitorIds).toEqual([]);
    expect(c.visits.some(v => v.visitorId === "admin-kim")).toBe(true);
  });
  it("의뢰 단계 분포와 의뢰마다 활동 2~4개", () => {
    const by = (st: string) => c.projects.filter(p => p.stage === st).length;
    expect(["measure", "quote", "design", "install", "settle"].map(by)).toEqual([2, 3, 3, 2, 2]);
    c.projects.forEach(p => { const n = c.activities.filter(a => a.projectId === p.id).length; expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(4); });
  });
});
