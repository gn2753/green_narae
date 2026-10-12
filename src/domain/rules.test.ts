import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Contract, Customer, Payment, Project, PurchaseOrder, LedgerEntry } from "./types";
import { moveProjectStage, skippedStages, setProjectWaiting, waitingDays, isProjectOverdue, skipConfirmTitle, describeProjectEdit, compareBoardProjects, overdueDays } from "./projects";
import { inquiryFormSchema, findCustomerByPhone, addReply } from "./inquiries";
import { activePayments, paymentsForSignedContract, paymentStatus, receivables, isProjectSettled, ledgerDraftFromOrder, ledgerSummary } from "./money";
import { maskName, portfolioDraftFromProject } from "./portfolio";

const NOW = "2026-10-11T01:00:00.000Z";
const ctx = { now: NOW, actorId: "kim" as const, settings: DEFAULT_SETTINGS };
const meta = { id: "x", createdAt: NOW, updatedAt: NOW, version: 1 };
const project = (o: Partial<Project> = {}): Project => ({ ...meta, title: "온담카페", signType: "채널간판", customerId: "c1", inquiryId: null, stage: "measure", assigneeId: "choi", status: "active", waiting: null, stageRecords: {}, taxInvoiceIssued: false, ...o });

describe("projects", () => {
  it("건너뛴 단계 계산", () => {
    expect(skippedStages("measure", "design")).toEqual(["quote"]);
    expect(skippedStages("design", "measure")).toEqual([]);
  });
  it("단계 이동 시 이전 단계 기본 담당이면 새 단계 기본 담당으로", () => {
    const r = moveProjectStage(project({ stage: "measure", assigneeId: "choi" }), "quote", ctx);
    expect(r.project.stage).toBe("quote");
    expect(r.project.assigneeId).toBe("kim");
    expect(r.message).toBe("상담·실측 → 견적 단계로 이동");
  });
  it("직접 지정한 담당자는 유지", () => {
    const r = moveProjectStage(project({ stage: "measure", assigneeId: "kim" }), "install", ctx);
    expect(r.project.assigneeId).toBe("kim");
    expect(r.message).toContain("건너뜀: 견적, 디자인");
  });
  it("대기 표시와 경과일", () => {
    const r = setProjectWaiting(project(), { reason: "시안 확정" }, ctx);
    expect(r.project.waiting?.since).toBe(NOW);
    expect(waitingDays(r.project, "2026-10-14")).toBe(3);
    expect(setProjectWaiting(r.project, null, ctx).project.waiting).toBeNull();
  });
  it("건너뛰기 확인 문구", () => {
    expect(skipConfirmTitle(DEFAULT_SETTINGS, "quote", "install")).toBe("디자인 단계를 건너뛰고 시공·납품으로 옮길까요?");
    expect(skipConfirmTitle(DEFAULT_SETTINGS, "measure", "install")).toBe("견적·디자인 단계를 건너뛰고 시공·납품으로 옮길까요?");
    expect(skipConfirmTitle(DEFAULT_SETTINGS, "measure", "design")).toBe("견적 단계를 건너뛰고 디자인으로 옮길까요?");
    expect(skipConfirmTitle(DEFAULT_SETTINGS, "measure", "settle")).toBe("견적·디자인·시공·납품 단계를 건너뛰고 정산·완료로 옮길까요?");
  });
  it("인라인 수정 패치는 바뀐 값만 기록", () => {
    const p = project({ title: "A", assigneeId: "kim", dueDate: "2026-10-20" });
    expect(describeProjectEdit(p, { title: "A", assigneeId: "kim", dueDate: "2026-10-20" }).message).toBe("");
    const r = describeProjectEdit(p, { assigneeId: "choi", dueDate: "2026-10-25" });
    expect(r.changes).toEqual({ assigneeId: "choi", dueDate: "2026-10-25" });
    expect(r.message).toBe("담당자 변경: 김자연 → 최관웅 · 마감일 변경: 2026-10-20 → 2026-10-25");
    expect(describeProjectEdit(p, { dueDate: "" }).message).toBe("마감일 삭제");
  });
  it("보드 정렬: 지연 → 마감일 → 등록순", () => {
    const a = project({ id: "a", dueDate: "2026-10-30", createdAt: "2026-10-01T00:00:00Z" });
    const b = project({ id: "b", dueDate: "2026-10-05", createdAt: "2026-10-02T00:00:00Z" });
    const c = project({ id: "c", createdAt: "2026-09-01T00:00:00Z" });
    const d = project({ id: "d", dueDate: "2026-10-30", createdAt: "2026-09-20T00:00:00Z" });
    expect([a, b, c, d].sort((x, y) => compareBoardProjects(x, y, "2026-10-11")).map(x => x.id)).toEqual(["b", "d", "a", "c"]);
    expect(overdueDays(b, "2026-10-11")).toBe(6);
  });
  it("지연", () => {
    expect(isProjectOverdue(project({ dueDate: "2026-10-10" }), "2026-10-11")).toBe(true);
    expect(isProjectOverdue(project({ dueDate: "2026-10-10", status: "done" }), "2026-10-11")).toBe(false);
  });
});

describe("inquiries", () => {
  it("폼 검증", () => {
    expect(inquiryFormSchema.safeParse({ name: "홍길동", phone: "010-1234-5678", email: "a@b.kr", message: "간판 견적 문의드립니다", agree: true }).success).toBe(true);
    expect(inquiryFormSchema.safeParse({ name: "홍길동", phone: "123", email: "a@b.kr", message: "간판 견적 문의드립니다", agree: true }).success).toBe(false);
    expect(inquiryFormSchema.safeParse({ name: "홍길동", phone: "010-1234-5678", email: "a@b.kr", message: "짧음", agree: true }).success).toBe(false);
    expect(inquiryFormSchema.safeParse({ name: "홍길동", phone: "010-1234-5678", email: "a@b.kr", message: "간판 견적 문의드립니다", agree: false }).success).toBe(false);
  });
  it("연락처로 고객 찾기(하이픈 무시)", () => {
    const c = { ...meta, id: "c1", name: "박", phone: "010-1234-5678", sites: [] } as Customer;
    expect(findCustomerByPhone([c], "01012345678")?.id).toBe("c1");
    expect(findCustomerByPhone([c], "01099998888")).toBeNull();
  });
  it("답변 기록 시 답변완료·NEW 해제", () => {
    const inq = { ...meta, name: "홍", phone: "010", message: "m", source: "web", status: "open", isNew: true, assigneeId: null, customerId: null, projectId: null, replies: [] } as never;
    const r = addReply(inq, { at: NOW, by: "kim", channel: "phone", message: "통화함" }, "r1");
    expect(r.status).toBe("answered"); expect(r.isNew).toBe(false); expect(r.replies).toHaveLength(1);
  });
});

describe("money", () => {
  const contract = { ...meta, id: "k1", customerId: "c1", projectId: "p1", status: "signed", quoteAmount: 3_000_000, vatIncluded: true, contractAmount: 3_200_000, deposit: { amount: 1_000_000, dueDate: "2026-10-05" }, balance: { amount: 2_200_000, dueDate: "2026-10-30" } } as Contract;
  it("계약완료 → 계약금·잔금 입금 예정", () => {
    const ps = paymentsForSignedContract(contract);
    expect(ps.map(p => [p.kind, p.amount, p.dueDate])).toEqual([["deposit", 1_000_000, "2026-10-05"], ["balance", 2_200_000, "2026-10-30"]]);
  });
  const pays = paymentsForSignedContract(contract).map((p, i) => ({ ...meta, id: `pay${i}`, ...p })) as Payment[];
  it("상태·미수금", () => {
    expect(paymentStatus(pays[0], "2026-10-11")).toBe("overdue");
    expect(paymentStatus(pays[1], "2026-10-11")).toBe("scheduled");
    expect(receivables(pays, "2026-10-11")).toEqual({ overdueAmount: 1_000_000, overdueCount: 1, outstandingAmount: 3_200_000 });
    expect(isProjectSettled(pays, "p1")).toBe(false);
    expect(isProjectSettled(pays.map(p => ({ ...p, paidOn: "2026-10-11" })), "p1")).toBe(true);
  });
  it("발주 → 매입 초안 (부가세 10% 분리)", () => {
    const o = { ...meta, vendorId: "v1", projectId: "p1", item: "채널 글자", amount: 1_100_000, orderedOn: "2026-10-01", dueDate: "2026-10-08", status: "received", receivedOn: "2026-10-08" } as PurchaseOrder;
    expect(ledgerDraftFromOrder(o, DEFAULT_SETTINGS)).toMatchObject({ type: "purchase", date: "2026-10-08", amount: 1_000_000, vat: 100_000, category: "외주제작", vendorId: "v1", projectId: "p1", sourceRef: { kind: "order", id: "x" } });
  });
  it("기간 집계", () => {
    const e = (o: Partial<LedgerEntry>) => ({ ...meta, type: "sale", date: "2026-10-01", amount: 0, vat: 0, ...o }) as LedgerEntry;
    const s = ledgerSummary([e({ amount: 500, projectId: "p1" }), e({ type: "purchase", amount: 200, category: "자재비", projectId: "p1" }), e({ date: "2026-09-10", amount: 100 })], "2026-10-01", "2026-10-31");
    expect(s.sales).toBe(500); expect(s.purchases).toBe(200); expect(s.diff).toBe(300);
    expect(s.byMonth).toEqual([{ month: "2026-10", sales: 500, purchases: 200 }]);
    expect(s.byCategory).toEqual([{ category: "자재비", amount: 200 }]);
    expect(s.byProject).toEqual([{ projectId: "p1", sales: 500, purchases: 200, diff: 300 }]);
  });
});

describe("portfolio", () => {
  it("거래처명 가리기", () => { expect(maskName("온담카페")).toBe("○○카페"); expect(maskName("해봄")).toBe("해○"); });
  it("의뢰 → 비공개 초안", () => {
    const after = { id: "a1", name: "after.jpg", mime: "image/jpeg", url: "/samples/x.svg", size: 1, uploadedBy: "choi" as const, at: NOW };
    const p = project({ stage: "install", stageRecords: { install: { fields: { installedOn: "2026-10-09" }, attachments: [after] } } });
    const c = { ...meta, id: "c1", name: "박○○", company: "온담카페", phone: "010", sites: [] } as Customer;
    const d = portfolioDraftFromProject(p, c, "2026-10-11", "세종");
    expect(d).toMatchObject({ title: "온담카페 채널간판", signType: "채널간판", region: "세종", completedOn: "2026-10-09", clientDisplayName: "세종 ○○카페", published: false, projectId: "x" });
    expect(d.cover.id).toBe("a1");
  });
});

describe("activePayments", () => {
  it("취소된 계약의 입금 항목은 집계에서 제외한다", () => {
    const mk = (id: string, contractId: string, amount: number) => ({ id, contractId, customerId: "c1", projectId: "p1", kind: "balance" as const, amount, dueDate: "2026-10-01", paidOn: null, createdAt: "", updatedAt: "", version: 1 });
    const contracts = [{ id: "k1", status: "signed" }, { id: "k2", status: "cancelled" }] as never;
    const live = activePayments([mk("a", "k1", 100), mk("b", "k2", 900), mk("c", "kX", 50)], contracts);
    expect(live.map(p => p.id)).toEqual(["a", "c"]);
    expect(receivables(live, "2026-10-11").overdueAmount).toBe(150);
  });
});

import { splitVat } from "./money";
describe("splitVat", () => {
  it("합계를 공급가액 + 부가세 10%로 나눈다", () => {
    expect(splitVat(110_000)).toEqual({ amount: 100_000, vat: 10_000 });
    expect(splitVat(1)).toEqual({ amount: 1, vat: 0 });
    const r = splitVat(123_457); expect(r.amount + r.vat).toBe(123_457);
  });
});

import { chartMonths, periodRange } from "./ledgerPeriod";
describe("ledgerPeriod", () => {
  it("이번 달·지난 달·분기·올해", () => {
    expect(periodRange("month", "2026-10-11")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(periodRange("lastMonth", "2026-10-11")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(periodRange("lastMonth", "2026-01-05")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(periodRange("quarter", "2026-10-11")).toEqual({ from: "2026-10-01", to: "2026-12-31" });
    expect(periodRange("quarter", "2026-05-31")).toEqual({ from: "2026-04-01", to: "2026-06-30" });
    expect(periodRange("year", "2026-10-11")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(periodRange("month", "2028-02-10").to).toBe("2028-02-29");
  });
  it("직접: 뒤바뀐 날짜는 바로잡고, 잘못된 값은 이번 달", () => {
    expect(periodRange("custom", "2026-10-11", { from: "2026-09-20", to: "2026-08-01" })).toEqual({ from: "2026-08-01", to: "2026-09-20" });
    expect(periodRange("custom", "2026-10-11", { from: "x" })).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(periodRange("custom", "2026-10-11", { from: "2026-09-20" })).toEqual({ from: "2026-09-20", to: "2026-09-20" });
  });
  it("차트 달 목록: 한 달이면 최근 6개월, 길면 기간의 달", () => {
    expect(chartMonths("2026-10-01", "2026-10-31")).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(chartMonths("2026-10-01", "2026-12-31")).toEqual(["2026-10", "2026-11", "2026-12"]);
    expect(chartMonths("2025-01-01", "2026-12-31")).toHaveLength(12);
  });
});
