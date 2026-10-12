"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Paperclip, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { NewDoc } from "@/data/repository";
import { useAdmin, useCollection, useMutation, useRepo, useToday } from "@/data/hooks";
import { PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { daysBetween } from "@/domain/dates";
import { activePayments, isProjectSettled, paymentStatus, receivables } from "@/domain/money";
import type { ISODate, LedgerEntry, Payment } from "@/domain/types";
import { addExtraPayment } from "@/services/moneyService";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { DateField } from "@/components/common/DateField";
import { EmptyState } from "@/components/common/EmptyState";
import { MoneyInput } from "@/components/common/MoneyInput";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import { Label } from "@/components/ui/label";
import { formatDateKo, formatWon } from "@/lib/format";
import { ConfirmPaymentDialog } from "./ConfirmPaymentDialog";
import { LedgerSuggestDialog } from "./LedgerSuggestDialog";

type Filter = "all" | "scheduled" | "overdue" | "paid";
const FILTERS: { key: Filter; label: string }[] = [{ key: "all", label: "전체" }, { key: "scheduled", label: "예정" }, { key: "overdue", label: "미수" }, { key: "paid", label: "입금확인" }];
const isFilter = (v: string | null): v is Filter => v === "all" || v === "scheduled" || v === "overdue" || v === "paid";
const STATUS_LABEL = { scheduled: "입금 예정", overdue: "미수", paid: "입금확인" } as const;
const STATUS_TONE: Record<"scheduled" | "overdue" | "paid", StatusTone> = { scheduled: "yellow", overdue: "red", paid: "green" };
const btnCls = "inline-flex whitespace-nowrap items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold";

/** A07 계약금·잔금. `?status=all|scheduled|overdue|paid`, `?id=` 해당 입금 항목 강조. */
export function PaymentList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();
  const rawPayments = useCollection("payments");
  const contractsCol = useCollection("contracts");
  const payments = useMemo(() => ({ items: activePayments(rawPayments.items, contractsCol.items), loading: rawPayments.loading || contractsCol.loading }), [rawPayments, contractsCol]);
  const customers = useCollection("customers");
  const projects = useCollection("projects");
  const loading = payments.loading || customers.loading || projects.loading;
  const sp = params.get("status");
  const filter: Filter = isFilter(sp) ? sp : "all";
  const highlightId = params.get("id");

  const [confirming, setConfirming] = useState<Payment | null>(null);
  const [draft, setDraft] = useState<NewDoc<LedgerEntry> | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [proofOf, setProofOf] = useState<Payment | null>(null);
  const [extraOpen, setExtraOpen] = useState(false);

  const custName = useCallback((id: string) => customers.items.find(c => c.id === id)?.name ?? "(삭제된 고객)", [customers.items]);
  const projTitle = useCallback((id: string | null) => (id ? projects.items.find(p => p.id === id)?.title ?? "-" : "-"), [projects.items]);

  const stat = useCallback((p: Payment) => paymentStatus(p, today), [today]);
  const counts = useMemo(() => ({
    all: payments.items.length,
    scheduled: payments.items.filter(p => stat(p) === "scheduled").length,
    overdue: payments.items.filter(p => stat(p) === "overdue").length,
    paid: payments.items.filter(p => stat(p) === "paid").length,
  }), [payments.items, stat]);
  const rows = useMemo(() => payments.items
    .filter(p => filter === "all" || stat(p) === filter)
    .sort((a, b) => (a.paidOn ? 1 : 0) - (b.paidOn ? 1 : 0) || (a.paidOn ? (b.paidOn ?? "").localeCompare(a.paidOn) : a.dueDate.localeCompare(b.dueDate))), [payments.items, filter, stat]);

  const month = today.slice(0, 7);
  const monthScheduled = payments.items.filter(p => !p.paidOn && p.dueDate >= today && p.dueDate.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const rec = receivables(payments.items, today);
  const settledCount = new Set(payments.items.filter(p => p.projectId && isProjectSettled(payments.items, p.projectId)).map(p => p.projectId)).size;

  useEffect(() => {
    if (!highlightId || loading) return;
    const t = setTimeout(() => document.getElementById(`pay-${highlightId}`)?.scrollIntoView({ block: "center" }), 100);
    return () => clearTimeout(t);
  }, [highlightId, loading, filter]);

  const setFilter = (f: Filter) => { const q = new URLSearchParams(); if (f !== "all") q.set("status", f); const s = q.toString(); router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }); };
  const tabs = FILTERS.map(f => ({ label: `${f.label} ${counts[f.key]}`, href: f.key === "all" ? pathname : `${pathname}?status=${f.key}`, active: filter === f.key }));

  const dueText = (p: Payment) => {
    const st = stat(p);
    return (
      <span className="whitespace-nowrap">{formatDateKo(p.dueDate)}{st === "overdue" && <span className="ml-1.5 text-xs font-bold text-[#B42323]">{daysBetween(p.dueDate, today)}일 경과</span>}</span>
    );
  };
  const proofBtn = (p: Payment) => (p.proof
    ? <button type="button" onClick={() => setProofOf(p)} aria-label="이체 증빙 보기" className="inline-flex size-11 items-center justify-center rounded-lg text-[#1E6E41] hover:bg-[#F6F7F5] md:size-9"><Paperclip className="size-4" aria-hidden /></button>
    : <span className="text-[#9AA59F]">-</span>);
  const actionBtn = (p: Payment) => (!p.paidOn
    ? <button type="button" onClick={() => setConfirming(p)} className={`${btnCls} min-h-11 bg-brand text-white hover:bg-brand-dark md:min-h-9`}>입금 확인</button>
    : null);

  const addBtn = (
    <button type="button" onClick={() => setExtraOpen(true)} className={`${btnCls} border border-[#D5DDD8] bg-white px-4 font-medium hover:bg-[#F6F7F5]`}><Plus className="size-4" aria-hidden />추가 입금 항목</button>
  );

  const columns: DataTableColumn<Payment>[] = [
    { key: "cust", header: "고객", cell: p => <span id={`pay-${p.id}`} className="font-bold">{custName(p.customerId)}</span> },
    { key: "proj", header: "의뢰", cell: p => <span className="line-clamp-2 max-w-56">{projTitle(p.projectId)}</span> },
    { key: "kind", header: "구분", cell: p => PAYMENT_KIND_LABEL[p.kind] },
    { key: "amount", header: "금액", align: "right", cell: p => <span className="font-bold">{formatWon(p.amount)}</span> },
    { key: "due", header: "입금 예정일", cell: dueText },
    { key: "paid", header: "입금일", showFrom: "lg", cell: p => (p.paidOn ? formatDateKo(p.paidOn) : "-") },
    { key: "status", header: "상태", cell: p => <StatusBadge tone={STATUS_TONE[stat(p)]}>{STATUS_LABEL[stat(p)]}</StatusBadge> },
    { key: "proof", header: "증빙", showFrom: "lg", align: "center", cell: proofBtn },
    { key: "act", header: "", align: "right", cell: actionBtn },
  ];

  return (
    <>
      <PageHeader title="계약금·잔금" description="입금 예정과 미수금을 확인하고 입금을 기록해요." actions={addBtn} tabs={tabs} />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4"><p className="text-xs text-[#5F6B64]">이번 달 입금 예정 금액</p><p className="mt-1 text-lg font-black md:text-xl">{formatWon(monthScheduled)}</p></div>
        <button type="button" onClick={() => setFilter("overdue")} className="rounded-xl border border-[#F4C9C9] bg-[#FDECEC] p-3 text-left md:p-4"><p className="text-xs text-[#B42323]">미수금 합계</p><p className="mt-1 text-lg font-black text-[#B42323] md:text-xl">{formatWon(rec.overdueAmount)} <span className="text-sm font-bold">{rec.overdueCount}건</span></p></button>
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4"><p className="text-xs text-[#5F6B64]">정산 완료 의뢰</p><p className="mt-1 text-lg font-black md:text-xl">{settledCount}건</p></div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={p => p.id} loading={loading} caption="입금 내역"
        rowClassName={p => (p.id === highlightId ? "bg-[#FFF8E0] ring-2 ring-[#E0A800] ring-inset" : undefined)}
        empty={<EmptyState icon={Wallet} title={filter === "overdue" ? "미수금이 없어요" : "입금 내역이 없어요"} description={filter === "overdue" ? "예정일이 지난 미입금 항목이 없어요." : "계약완료로 저장하면 계약금·잔금 입금 예정이 만들어져요."} />}
        mobileCard={p => (
          <div id={`pay-${p.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-bold">{custName(p.customerId)} <span className="text-sm font-normal text-[#56645C]">· {PAYMENT_KIND_LABEL[p.kind]}</span></p><p className="mt-0.5 truncate text-sm text-[#56645C]">{projTitle(p.projectId)}</p></div>
              <StatusBadge tone={STATUS_TONE[stat(p)]}>{STATUS_LABEL[stat(p)]}</StatusBadge>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div><p className="font-bold">{formatWon(p.amount)}</p><p className="text-xs text-[#56645C]">{p.paidOn ? `입금일 ${formatDateKo(p.paidOn)}` : <>예정 {dueText(p)}</>}</p></div>
              <div className="flex items-center gap-1">{p.proof && proofBtn(p)}{actionBtn(p)}</div>
            </div>
          </div>
        )} />
      <ConfirmPaymentDialog payment={confirming} open={!!confirming} onOpenChange={o => { if (!o) setConfirming(null); }}
        onConfirmed={d => { setConfirming(null); setDraft(d); setLedgerOpen(true); }} />
      <LedgerSuggestDialog draft={draft} open={ledgerOpen} onOpenChange={setLedgerOpen} />
      <ResponsiveDialog open={!!proofOf} onOpenChange={o => { if (!o) setProofOf(null); }} size="sm" title="이체 증빙" description={proofOf ? `${custName(proofOf.customerId)} · ${PAYMENT_KIND_LABEL[proofOf.kind]}` : undefined}>
        {proofOf?.proof && <AttachmentGallery items={[proofOf.proof]} />}
      </ResponsiveDialog>
      <ExtraPaymentDialog open={extraOpen} onOpenChange={setExtraOpen} today={today} />
    </>
  );
}

/** 추가 입금 항목: 계약 선택 · 금액 · 입금 예정일 */
function ExtraPaymentDialog({ open, onOpenChange, today }: { open: boolean; onOpenChange: (o: boolean) => void; today: ISODate }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const { items: contracts } = useCollection("contracts");
  const { items: customers } = useCollection("customers");
  const { items: projects } = useCollection("projects");
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState<ISODate | "">(today);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setContractId(""); setAmount(0); setDueDate(today); } }

  const options = [{ value: "", label: "계약 선택" }, ...contracts.filter(c => c.status === "signed").map(c => {
    const name = customers.find(x => x.id === c.customerId)?.name ?? "고객";
    const title = c.projectId ? projects.find(p => p.id === c.projectId)?.title : undefined;
    return { value: c.id, label: title ? `${name} · ${title}` : name };
  })];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (!contractId) { toast.error("계약을 선택해주세요."); return; }
    if (amount <= 0) { toast.error("금액을 입력해주세요."); return; }
    if (!dueDate) { toast.error("입금 예정일을 입력해주세요."); return; }
    const ok = await run(() => addExtraPayment(repo, { contractId, amount, dueDate }, admin.id), "추가 입금 항목을 만들었어요", { exclusive: true });
    if (ok) onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="sm" title="추가 입금 항목" description="계약금·잔금 외에 추가로 받을 금액을 등록해요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form="extra-payment-form" disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "추가"}
        </button>
      </>}>
      <form id="extra-payment-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="ex-contract">계약</Label><TaskSelect id="ex-contract" label="계약" value={contractId} options={options} disabled={busy} onChange={setContractId} /></div>
        <div className="space-y-1.5"><Label htmlFor="ex-amount">금액</Label><MoneyInput id="ex-amount" value={amount} disabled={busy} onChange={setAmount} /></div>
        <div className="space-y-1.5"><Label htmlFor="ex-due">입금 예정일</Label><DateField id="ex-due" value={dueDate} disabled={busy} onChange={setDueDate} /></div>
      </form>
    </ResponsiveDialog>
  );
}
