import { CONTRACT_STATUS_LABEL } from "@/domain/defaults";
import type { Contract, ContractStatus, Payment } from "@/domain/types";
import type { StatusTone } from "@/components/common/StatusBadge";

export const CONTRACT_TONE: Record<ContractStatus, StatusTone> = { draft: "gray", sent: "yellow", signed: "green", cancelled: "red" };
export const CONTRACT_STATUSES: ContractStatus[] = ["draft", "sent", "signed", "cancelled"];
export const isContractStatus = (v: string | null): v is ContractStatus => v !== null && (CONTRACT_STATUSES as string[]).includes(v);
export const statusOptions = CONTRACT_STATUSES.map(s => ({ value: s, label: CONTRACT_STATUS_LABEL[s] }));

/** 계약에 연결된 계약금·잔금 입금 항목 */
export function slotPayment(payments: Payment[], c: Contract, kind: "deposit" | "balance"): Payment | undefined {
  return payments.find(p => p.contractId === c.id && p.kind === kind);
}
/** 다음 입금 예정일: 입금 전인 항목 중 가장 빠른 예정일 */
export function nextDueDate(payments: Payment[], c: Contract): string | null {
  const due = payments.filter(p => p.contractId === c.id && !p.paidOn).map(p => p.dueDate).sort();
  return due[0] ?? null;
}
