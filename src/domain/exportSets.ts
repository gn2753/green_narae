import type { DemoSnapshot } from "@/data/repository";
import { CONTRACT_STATUS_LABEL, PAYMENT_KIND_LABEL, PRIORITY_LABEL, PRIORITY_ORDER, TASK_CATEGORY_ORDER, TASK_STATUS_LABEL, ADMINS, categoryLabel } from "./defaults";
import { koreaDate } from "./dates";
import { paymentStatus } from "./money";
import type { Settings, Task } from "./types";

type Data = DemoSnapshot["collections"];
export interface ExportSet {
  label: string;
  description: string;
  columns: { key: string; label: string }[];
  rows: (data: Data, settings: Settings) => Record<string, unknown>[];
}

/** 기존 인쇄물과 같은 정렬: 파트 순서, 우선순위, 일정일, 마감일, 등록순 */
export function sortTasksForPrint(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => TASK_CATEGORY_ORDER.indexOf(a.category) - TASK_CATEGORY_ORDER.indexOf(b.category)
    || PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    || a.workDate.localeCompare(b.workDate) || a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt));
}

/** 담당자 표시명: 알려진 관리자 id는 이름, 아니면 입력된 담당자 텍스트 */
export const taskAssigneeName = (t: Task): string => (t.assigneeId && ADMINS[t.assigneeId]?.name) || t.assignee || "";
const day = (iso?: string | null) => (iso ? koreaDate(new Date(iso)) : "");
const byId = <T extends { id: string }>(list: T[]) => new Map(list.map(x => [x.id, x]));
const PAY_STATUS = { scheduled: "입금 예정", overdue: "미수금", paid: "입금확인" } as const;
const col = (key: string, label: string) => ({ key, label });

export const exportSets: Record<"tasks" | "customers" | "contracts" | "ledger" | "payments", ExportSet> = {
  tasks: {
    label: "업무", description: "전체 업무 목록(파트·담당자·우선순위·일정·상태)",
    columns: [col("no", "번호"), col("category", "업무파트"), col("title", "업무명"), col("assignee", "담당자"), col("priority", "우선순위"), col("workDate", "일정일"), col("dueDate", "마감일"), col("status", "상태")],
    rows: (d, s) => sortTasksForPrint(d.tasks).map((t, i) => ({
      no: i + 1, category: categoryLabel(s, t.category), title: t.title, assignee: taskAssigneeName(t),
      priority: PRIORITY_LABEL[t.priority], workDate: t.workDate, dueDate: t.dueDate, status: TASK_STATUS_LABEL[t.status],
    })),
  },
  customers: {
    label: "고객", description: "고객 연락처와 현장 정보",
    columns: [col("name", "이름"), col("company", "회사"), col("phone", "연락처"), col("email", "이메일"), col("sites", "현장"), col("memo", "메모"), col("createdOn", "등록일")],
    rows: d => d.customers.map(c => ({ name: c.name, company: c.company ?? "", phone: c.phone, email: c.email ?? "", sites: c.sites.join(" / "), memo: c.memo ?? "", createdOn: day(c.createdAt) })),
  },
  contracts: {
    label: "계약", description: "견적·계약 금액과 입금 일정",
    columns: [col("customer", "고객"), col("project", "프로젝트"), col("status", "상태"), col("quoteAmount", "견적금액"), col("vatIncluded", "부가세 포함"), col("contractAmount", "계약금액"), col("signedOn", "계약일"), col("depositAmount", "계약금"), col("depositDue", "계약금 기한"), col("balanceAmount", "잔금"), col("balanceDue", "잔금 기한"), col("memo", "메모")],
    rows: d => { const cu = byId(d.customers), pr = byId(d.projects); return d.contracts.map(c => ({
      customer: cu.get(c.customerId)?.name ?? "", project: (c.projectId && pr.get(c.projectId)?.title) || "", status: CONTRACT_STATUS_LABEL[c.status],
      quoteAmount: c.quoteAmount, vatIncluded: c.vatIncluded ? "포함" : "별도", contractAmount: c.contractAmount ?? "", signedOn: c.signedOn ?? "",
      depositAmount: c.deposit?.amount ?? "", depositDue: c.deposit?.dueDate ?? "", balanceAmount: c.balance?.amount ?? "", balanceDue: c.balance?.dueDate ?? "", memo: c.memo ?? "",
    })); },
  },
  ledger: {
    label: "매입·매출", description: "매입·매출 장부(금액·부가세·거래처)",
    columns: [col("date", "일자"), col("type", "구분"), col("category", "분류"), col("amount", "금액"), col("vat", "부가세"), col("party", "거래처"), col("project", "프로젝트"), col("memo", "메모")],
    rows: d => { const ve = byId(d.vendors), cu = byId(d.customers), pr = byId(d.projects); return [...d.ledger].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({
      date: l.date, type: l.type === "sale" ? "매출" : "매입", category: l.category ?? "", amount: l.amount, vat: l.vat,
      party: (l.type === "sale" ? l.customerId && cu.get(l.customerId)?.name : l.vendorId && ve.get(l.vendorId)?.name) || "",
      project: (l.projectId && pr.get(l.projectId)?.title) || "", memo: l.memo ?? "",
    })); },
  },
  payments: {
    label: "계약금·잔금", description: "입금 항목 전체(취소 계약 포함, 상태 표시)",
    columns: [col("customer", "고객"), col("project", "프로젝트"), col("kind", "구분"), col("amount", "금액"), col("dueDate", "입금기한"), col("paidOn", "입금일"), col("status", "상태"), col("confirmedBy", "확인자")],
    rows: d => { const cu = byId(d.customers), pr = byId(d.projects), co = byId(d.contracts), today = koreaDate(); return d.payments.map(p => ({
      customer: cu.get(p.customerId)?.name ?? "", project: (p.projectId && pr.get(p.projectId)?.title) || "", kind: PAYMENT_KIND_LABEL[p.kind],
      amount: p.amount, dueDate: p.dueDate, paidOn: p.paidOn ?? "", status: co.get(p.contractId)?.status === "cancelled" ? "취소 계약" : PAY_STATUS[paymentStatus(p, today)], confirmedBy: (p.confirmedBy && ADMINS[p.confirmedBy]?.name) || "",
    })); },
  },
};
