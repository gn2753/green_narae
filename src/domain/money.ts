import type { Base, Contract, ISODate, LedgerEntry, Payment, PurchaseOrder, Settings } from "./types";

export function paymentsForSignedContract(c: Contract): Omit<Payment, keyof Base>[] {
  const mk = (kind: Payment["kind"], x?: { amount: number; dueDate: ISODate }) => x && x.amount > 0
    ? [{ contractId: c.id, customerId: c.customerId, projectId: c.projectId, kind, amount: x.amount, dueDate: x.dueDate, paidOn: null }] : [];
  return [...mk("deposit", c.deposit), ...mk("balance", c.balance)];
}
/** 취소된 계약의 입금 항목은 미수금·입금 예정·정산 집계에서 뺀다. */
export function activePayments(payments: Payment[], contracts: Contract[]): Payment[] {
  const cancelled = new Set(contracts.filter(c => c.status === "cancelled").map(c => c.id));
  return payments.filter(p => !cancelled.has(p.contractId));
}
export function paymentStatus(p: Payment, today: ISODate): "scheduled" | "overdue" | "paid" {
  return p.paidOn ? "paid" : p.dueDate < today ? "overdue" : "scheduled";
}
export function receivables(payments: Payment[], today: ISODate) {
  const unpaid = payments.filter(p => !p.paidOn);
  const overdue = unpaid.filter(p => p.dueDate < today);
  return { overdueAmount: overdue.reduce((s, p) => s + p.amount, 0), overdueCount: overdue.length, outstandingAmount: unpaid.reduce((s, p) => s + p.amount, 0) };
}
export function isProjectSettled(payments: Payment[], projectId: string) {
  const ps = payments.filter(p => p.projectId === projectId);
  return ps.length > 0 && ps.every(p => !!p.paidOn);
}
/** 부가세 포함 합계를 공급가액 + 부가세(10%)로 나눈다. */
export const splitVat = (gross: number) => { const amount = Math.round(gross / 1.1); return { amount, vat: gross - amount }; };
export function ledgerDraftFromOrder(o: PurchaseOrder, settings: Settings): Omit<LedgerEntry, keyof Base> {
  return { type: "purchase", date: o.receivedOn ?? o.dueDate, ...splitVat(o.amount), category: settings.purchaseCategories.includes("외주제작") ? "외주제작" : settings.purchaseCategories[0], vendorId: o.vendorId, projectId: o.projectId, memo: o.item, sourceRef: { kind: "order", id: o.id } };
}
export function ledgerDraftFromPayment(p: Payment): Omit<LedgerEntry, keyof Base> {
  return { type: "sale", date: p.paidOn ?? p.dueDate, ...splitVat(p.amount), customerId: p.customerId, projectId: p.projectId, memo: p.kind === "deposit" ? "계약금" : p.kind === "balance" ? "잔금" : "추가 입금", sourceRef: { kind: "payment", id: p.id } };
}
export interface LedgerSummary {
  sales: number; purchases: number; diff: number;
  byMonth: { month: string; sales: number; purchases: number }[];
  byCategory: { category: string; amount: number }[];
  byProject: { projectId: string; sales: number; purchases: number; diff: number }[];
}
export function ledgerSummary(entries: LedgerEntry[], from: ISODate, to: ISODate): LedgerSummary {
  const inRange = entries.filter(e => e.date >= from && e.date <= to);
  const sum = (xs: LedgerEntry[]) => xs.reduce((s, e) => s + e.amount, 0);
  const sales = sum(inRange.filter(e => e.type === "sale")), purchases = sum(inRange.filter(e => e.type === "purchase"));
  const months = [...new Set(inRange.map(e => e.date.slice(0, 7)))].sort();
  const cats = new Map<string, number>(); const projs = new Map<string, { sales: number; purchases: number }>();
  for (const e of inRange) {
    if (e.type === "purchase") cats.set(e.category ?? "기타", (cats.get(e.category ?? "기타") ?? 0) + e.amount);
    if (e.projectId) { const p = projs.get(e.projectId) ?? { sales: 0, purchases: 0 }; p[e.type === "sale" ? "sales" : "purchases"] += e.amount; projs.set(e.projectId, p); }
  }
  return {
    sales, purchases, diff: sales - purchases,
    byMonth: months.map(m => ({ month: m, sales: sum(inRange.filter(e => e.type === "sale" && e.date.startsWith(m))), purchases: sum(inRange.filter(e => e.type === "purchase" && e.date.startsWith(m))) })),
    byCategory: [...cats].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    byProject: [...projs].map(([projectId, v]) => ({ projectId, ...v, diff: v.sales - v.purchases })).sort((a, b) => b.diff - a.diff),
  };
}
