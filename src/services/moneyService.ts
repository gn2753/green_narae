import type { NewDoc, Repository } from "@/data/repository";
import type { AdminId, Attachment, Contract, ISODate, LedgerEntry, OrderStatus, Payment, PurchaseOrder, Vendor } from "@/domain/types";
import { ledgerDraftFromOrder, ledgerDraftFromPayment, paymentsForSignedContract } from "@/domain/money";
import { CONTRACT_STATUS_LABEL, ORDER_STATUS_LABEL, PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { isValidISODate, koreaDate } from "@/domain/dates";
import { formatWon } from "@/lib/format";
import { NotFoundError } from "@/data/errors";
import { log } from "./projectService";

function withoutId<T extends { id?: string }>(doc: T): Omit<T, "id"> { const copy = { ...doc }; delete copy.id; return copy; }

/** 견적·계약 저장. 상태가 계약완료(signed)로 바뀌면 계약금·잔금 입금 예정을 만든다. */
export async function saveContract(repo: Repository, input: NewDoc<Contract>, existing: Contract | null, actorId: AdminId): Promise<Contract> {
  const becameSigned = input.status === "signed" && existing?.status !== "signed";
  const data = becameSigned && !input.signedOn ? { ...input, signedOn: koreaDate() } : input;
  const saved = existing ? await repo.update("contracts", existing.id, withoutId(data), existing.version) : await repo.create("contracts", data);
  let created = 0;
  if (becameSigned) {
    // 다시 계약완료로 바뀐 경우(계약완료 → 견적발송 → 계약완료) 계약금·잔금이 이미 있으면 새로 만들지 않는다.
    const already = (await repo.list("payments")).some(p => p.contractId === saved.id && (p.kind === "deposit" || p.kind === "balance"));
    if (!already) for (const p of paymentsForSignedContract(saved)) { await repo.create("payments", p); created++; }
  }
  if (saved.projectId) {
    await log(repo, saved.projectId, actorId, "money", becameSigned
      ? `계약 완료${saved.contractAmount ? ` (${formatWon(saved.contractAmount)})` : ""}${created ? ` — 입금 예정 ${created}건 생성` : ""}`
      : `견적·계약 저장 (${CONTRACT_STATUS_LABEL[saved.status]})`);
  }
  return saved;
}

/** 입금 확인 → 매출 초안 반환(저장은 화면에서 사용자가 확인한 뒤 repo.create("ledger", draft)) */
export async function confirmPayment(repo: Repository, paymentId: string, input: { paidOn: ISODate; proof?: Attachment }, actorId: AdminId): Promise<{ payment: Payment; ledgerDraft: NewDoc<LedgerEntry> }> {
  const p = await repo.get("payments", paymentId); if (!p) throw new NotFoundError("입금 예정");
  if (p.paidOn) throw new Error("이미 입금 확인된 항목입니다.");
  const payment = await repo.update("payments", paymentId, { paidOn: input.paidOn, ...(input.proof ? { proof: input.proof } : {}), confirmedBy: actorId }, p.version);
  if (payment.projectId) await log(repo, payment.projectId, actorId, "money", `입금 확인: ${PAYMENT_KIND_LABEL[payment.kind]} ${formatWon(payment.amount)} (${input.paidOn})`);
  return { payment, ledgerDraft: ledgerDraftFromPayment(payment) };
}

/** 추가 입금 항목 등록(계약의 고객·의뢰를 이어받는다). */
export async function addExtraPayment(repo: Repository, input: { contractId: string; amount: number; dueDate: ISODate }, actorId: AdminId): Promise<Payment> {
  if (!(input.amount > 0)) throw new Error("금액은 0보다 커야 합니다.");
  if (!input.dueDate) throw new Error("입금 예정일을 입력해주세요.");
  const c = await repo.get("contracts", input.contractId); if (!c) throw new NotFoundError("계약");
  const payment = await repo.create("payments", { contractId: c.id, customerId: c.customerId, projectId: c.projectId, kind: "extra", amount: input.amount, dueDate: input.dueDate, paidOn: null });
  if (c.projectId) await log(repo, c.projectId, actorId, "money", `추가 입금 예정 등록: ${formatWon(input.amount)} (${input.dueDate})`);
  return payment;
}

/** 발주 상태 변경. 수령완료면 수령일을 기록하고 매입 초안을 돌려준다. */
export async function setOrderStatus(repo: Repository, orderId: string, status: OrderStatus, actorId: AdminId): Promise<{ order: PurchaseOrder; ledgerDraft: NewDoc<LedgerEntry> | null }> {
  const o = await repo.get("orders", orderId); if (!o) throw new NotFoundError("발주");
  const receivedOn = status === "received" ? o.receivedOn ?? koreaDate() : null;
  const order = await repo.update("orders", orderId, { status, receivedOn }, o.version);
  if (order.projectId) await log(repo, order.projectId, actorId, "money", `발주 상태 변경: ${order.item} → ${ORDER_STATUS_LABEL[status]}`);
  const ledgerDraft = status === "received" && o.status !== "received" ? ledgerDraftFromOrder(order, await repo.getSettings()) : null;
  return { order, ledgerDraft };
}

/** 제작업체 등록·수정. 업체명 필수, 분야는 설정(vendorFields)에 있는 값. */
export async function saveVendor(repo: Repository, input: NewDoc<Vendor>, existing: Vendor | null): Promise<Vendor> {
  const name = input.name.trim(); if (!name) throw new Error("업체명을 입력해주세요.");
  const fields = (await repo.getSettings()).vendorFields;
  if (!fields.includes(input.field)) throw new Error("분야를 선택해주세요.");
  const data = { ...input, name, contactName: input.contactName?.trim() || undefined, phone: input.phone?.trim() || undefined, memo: input.memo?.trim() || undefined };
  return existing ? repo.update("vendors", existing.id, withoutId(data), existing.version) : repo.create("vendors", data);
}

/** 발주 등록·수정. 새 발주에 의뢰가 연결되면 의뢰 활동에 기록한다. */
export async function saveOrder(repo: Repository, input: NewDoc<PurchaseOrder>, existing: PurchaseOrder | null, actorId: AdminId): Promise<PurchaseOrder> {
  const vendor = input.vendorId ? await repo.get("vendors", input.vendorId) : null;
  if (!vendor) throw new Error("업체를 선택해주세요.");
  const item = input.item.trim(); if (!item) throw new Error("제작 품목을 입력해주세요.");
  if (!(input.amount > 0)) throw new Error("발주 금액은 0보다 커야 합니다.");
  if (!isValidISODate(input.orderedOn)) throw new Error("발주일을 입력해주세요.");
  if (!isValidISODate(input.dueDate)) throw new Error("납기를 입력해주세요.");
  if (input.dueDate < input.orderedOn) throw new Error("납기는 발주일 이후여야 합니다.");
  const data = { ...input, item, receivedOn: input.status === "received" ? input.receivedOn ?? koreaDate() : null };
  const saved = existing ? await repo.update("orders", existing.id, withoutId(data), existing.version) : await repo.create("orders", data);
  if (!existing && saved.projectId) await log(repo, saved.projectId, actorId, "money", `발주 등록: ${vendor.name} · ${item} · ${formatWon(saved.amount)}`);
  return saved;
}

/** 매입·매출 직접 등록·수정. 매입은 비용 항목 필수. */
export async function saveLedgerEntry(repo: Repository, input: NewDoc<LedgerEntry>, existing: LedgerEntry | null): Promise<LedgerEntry> {
  if (!(input.amount > 0)) throw new Error("금액은 0보다 커야 합니다.");
  if (input.vat < 0) throw new Error("부가세는 0 이상이어야 합니다.");
  if (!isValidISODate(input.date)) throw new Error("날짜를 입력해주세요.");
  if (input.type === "purchase" && !input.category) throw new Error("비용 항목을 선택해주세요.");
  const data = { ...input, memo: input.memo?.trim() || undefined, ...(input.type === "sale" ? { category: undefined } : {}) };
  return existing ? repo.update("ledger", existing.id, withoutId(data), existing.version) : repo.create("ledger", data);
}
