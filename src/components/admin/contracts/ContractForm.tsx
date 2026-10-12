"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo } from "@/data/hooks";
import { ConflictError } from "@/data/errors";
import { CONTRACT_STATUS_LABEL } from "@/domain/defaults";
import type { Attachment, Contract, ContractStatus, ISODate } from "@/domain/types";
import { saveContract } from "@/services/moneyService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DateField } from "@/components/common/DateField";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatWon } from "@/lib/format";
import { statusOptions } from "./contractUtils";

const FORM_ID = "contract-form";
const NONE = "none";
interface Draft {
  customerId: string; projectId: string; quoteAmount: number; vatIncluded: boolean; quoteFile: Attachment | undefined; quoteSentOn: ISODate | "";
  status: ContractStatus; contractAmount: number; signedOn: ISODate | "";
  depositAmount: number; depositDue: ISODate | ""; balanceAmount: number; balanceDue: ISODate | ""; balanceTouched: boolean; memo: string;
}
const fromContract = (c: Contract | null, pre?: { customerId?: string; projectId?: string }): Draft => ({
  customerId: c?.customerId ?? pre?.customerId ?? "", projectId: c?.projectId ?? pre?.projectId ?? "",
  quoteAmount: c?.quoteAmount ?? 0, vatIncluded: c?.vatIncluded ?? true, quoteFile: c?.quoteFile, quoteSentOn: c?.quoteSentOn ?? "",
  status: c?.status ?? "draft", contractAmount: c?.contractAmount ?? 0, signedOn: c?.signedOn ?? "",
  depositAmount: c?.deposit?.amount ?? 0, depositDue: c?.deposit?.dueDate ?? "", balanceAmount: c?.balance?.amount ?? 0, balanceDue: c?.balance?.dueDate ?? "",
  balanceTouched: !!c?.balance, memo: c?.memo ?? "",
});

/** 견적·계약 등록·수정. 상태를 계약완료로 저장하면 계약금·잔금 입금 예정이 만들어진다. */
export function ContractForm({ open, contract, prefill, onOpenChange, onSaved }: {
  open: boolean; contract: Contract | null; prefill?: { customerId?: string; projectId?: string };
  onOpenChange: (o: boolean) => void; onSaved: (c: Contract) => void;
}) {
  const repo = useRepo();
  const router = useRouter();
  const { admin } = useAdmin();
  const { items: customers } = useCollection("customers");
  const { items: projects } = useCollection("projects");
  const { run, busy } = useMutation();
  const [d, setD] = useState<Draft>(() => fromContract(contract, prefill));
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [base, setBase] = useState(contract); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(fromContract(contract, prefill)); setError(""); setBase(contract); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));
  // 계약 금액·계약금이 바뀌면 잔금은 `계약 금액 − 계약금`으로 자동 제안(직접 고친 뒤에는 그대로 둔다).
  const setAmounts = (patch: Partial<Pick<Draft, "contractAmount" | "depositAmount">>) => setD(x => {
    const n = { ...x, ...patch };
    return x.balanceTouched ? n : { ...n, balanceAmount: Math.max(0, n.contractAmount - n.depositAmount) };
  });

  const customerOptions = [{ value: NONE, label: "고객 선택" }, ...customers.map(c => ({ value: c.id, label: c.company ? `${c.name} (${c.company})` : c.name }))];
  const customerProjects = projects.filter(p => p.customerId === d.customerId);
  const projectOptions = [{ value: NONE, label: "연결 안 함" }, ...customerProjects.map(p => ({ value: p.id, label: p.title }))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (!d.customerId) { setError("고객을 선택해주세요."); return; }
    if (d.quoteAmount <= 0) { setError("견적 금액을 입력해주세요."); return; }
    if (d.status === "signed") {
      if (d.contractAmount <= 0) { setError("계약완료로 저장하려면 계약 금액을 입력해주세요."); return; }
      if ((d.depositAmount > 0 && !d.depositDue) || (d.balanceAmount > 0 && !d.balanceDue)) { setError("계약금·잔금의 입금 예정일을 입력해주세요."); return; }
    }
    setError("");
    if (contract?.status === "signed" && d.status === "cancelled") {
      const unpaid = (await repo.list("payments")).filter(p => p.contractId === contract.id && !p.paidOn).length;
      if (unpaid > 0) { setConfirmCancel(true); return; }
    }
    await save();
  };
  const save = async () => {
    if (!admin) return;
    const becameSigned = d.status === "signed" && contract?.status !== "signed";
    const input = {
      customerId: d.customerId, projectId: customerProjects.some(p => p.id === d.projectId) ? d.projectId : null, status: d.status,
      quoteAmount: d.quoteAmount, vatIncluded: d.vatIncluded, quoteFile: d.quoteFile, quoteSentOn: d.quoteSentOn || undefined,
      contractAmount: d.contractAmount > 0 ? d.contractAmount : undefined, signedOn: d.signedOn || undefined,
      deposit: d.depositAmount > 0 && d.depositDue ? { amount: d.depositAmount, dueDate: d.depositDue } : undefined,
      balance: d.balanceAmount > 0 && d.balanceDue ? { amount: d.balanceAmount, dueDate: d.balanceDue } : undefined,
      memo: d.memo.trim() || undefined,
    };
    const before = contract ? (await repo.list("payments")).filter(p => p.contractId === contract.id).length : 0;
    const saved = await run(() => saveContract(repo, input, contract && base?.id === contract.id ? base : contract, admin.id).catch(async er => {
      // 충돌이면 최신 내용으로 입력칸을 다시 채운다(안내 문구와 일치)
      if (er instanceof ConflictError && contract) { const latest = await repo.get("contracts", contract.id); if (latest) { setBase(latest); setD(fromContract(latest, prefill)); } }
      throw er;
    }), becameSigned ? undefined : "견적·계약을 저장했어요", { exclusive: true });
    if (!saved) return;
    if (becameSigned) {
      const created = (await repo.list("payments")).filter(p => p.contractId === saved.id).length - before;
      if (created > 0) toast.success(`계약금·잔금 입금 예정 ${created}건을 만들었어요`, { action: { label: "A07에서 보기", onClick: () => router.push("/admin/payments") } });
      else toast.success("계약완료로 저장했어요");
    }
    onSaved(saved);
  };
  const locked = contract?.status === "signed";
  const req = <span className="text-[#D64545]" aria-hidden>*</span>;

  return (
    <>
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="xl" title={contract ? "견적·계약 수정" : "견적·계약 등록"}
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="ct-customer">고객 {req}</Label>
          <TaskSelect id="ct-customer" label="고객" value={d.customerId || NONE} options={customerOptions} disabled={busy} onChange={v => setD(x => ({ ...x, customerId: v === NONE ? "" : v, projectId: "" }))} /></div>
        <div className="space-y-1.5"><Label htmlFor="ct-project">의뢰</Label>
          <TaskSelect id="ct-project" label="의뢰" value={d.projectId || NONE} options={projectOptions} disabled={busy || !d.customerId} onChange={v => set("projectId", v === NONE ? "" : v)} /></div>

        <div className="space-y-1.5"><Label htmlFor="ct-quote">견적 금액 {req}</Label><MoneyInput id="ct-quote" value={d.quoteAmount} disabled={busy} onChange={v => set("quoteAmount", v)} /></div>
        <div className="flex items-end pb-1">
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-10"><input type="checkbox" className="size-4 accent-[#2F8F57]" checked={d.vatIncluded} disabled={busy} onChange={e => set("vatIncluded", e.target.checked)} />부가세 포함 금액이에요</label>
        </div>

        <div className="space-y-2 sm:col-span-2"><Label>견적서 파일 (PDF·이미지)</Label>
          <AttachmentGallery items={d.quoteFile ? [d.quoteFile] : []} onRemove={() => set("quoteFile", undefined)} emptyText="첨부한 견적서가 없어요." />
          <AttachmentPicker label={d.quoteFile ? "견적서 바꾸기" : "견적서 첨부"} disabled={busy} onAdd={a => { if (a[0]) set("quoteFile", a[0]); }} />
        </div>

        <div className="space-y-1.5"><Label htmlFor="ct-status">상태</Label><TaskSelect id="ct-status" label="상태" value={d.status} options={statusOptions} disabled={busy} onChange={v => set("status", v as ContractStatus)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ct-sent">견적 발송일</Label><DateField id="ct-sent" value={d.quoteSentOn} disabled={busy} onChange={v => set("quoteSentOn", v)} /></div>

        <div className="space-y-1.5"><Label htmlFor="ct-amount">계약 금액 {d.status === "signed" && req}</Label><MoneyInput id="ct-amount" value={d.contractAmount} disabled={busy || locked} onChange={v => setAmounts({ contractAmount: v })} /></div>
        <div className="space-y-1.5"><Label htmlFor="ct-signed">계약일</Label><DateField id="ct-signed" value={d.signedOn} disabled={busy} onChange={v => set("signedOn", v)} /></div>

        <fieldset className="grid gap-3 rounded-xl border border-[#E3E8E4] p-3 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold">계약금·잔금 입금 예정</legend>
          <div className="space-y-1.5"><Label htmlFor="ct-dep">계약금</Label><MoneyInput id="ct-dep" value={d.depositAmount} disabled={busy || locked} onChange={v => setAmounts({ depositAmount: v })} /></div>
          <div className="space-y-1.5"><Label htmlFor="ct-depdue">계약금 입금 예정일</Label><DateField id="ct-depdue" value={d.depositDue} disabled={busy || locked} onChange={v => set("depositDue", v)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ct-bal">잔금</Label><MoneyInput id="ct-bal" value={d.balanceAmount} disabled={busy || locked} onChange={v => setD(x => ({ ...x, balanceAmount: v, balanceTouched: true }))} />
            <p className="text-xs text-[#7A867F]">계약 금액 − 계약금({formatWon(Math.max(0, d.contractAmount - d.depositAmount))})을 자동으로 제안해요. 직접 고칠 수 있어요.</p></div>
          <div className="space-y-1.5"><Label htmlFor="ct-baldue">잔금 입금 예정일</Label><DateField id="ct-baldue" value={d.balanceDue} disabled={busy || locked} onChange={v => set("balanceDue", v)} /></div>
          {contract?.status === "signed"
            ? <p className="text-xs text-[#8A6400] sm:col-span-2">계약이 완료되어 계약 금액·계약금·잔금은 고칠 수 없어요. 추가·조정이 필요하면 <Link href="/admin/payments" className="font-bold underline">계약금·잔금(A07)</Link>의 &lsquo;추가 입금 항목&rsquo;을 이용해주세요.</p>
            : d.status !== "signed" && <p className="text-xs text-[#5F6B64] sm:col-span-2">상태를 <b>{CONTRACT_STATUS_LABEL.signed}</b>로 저장하면 이 계약금·잔금이 입금 예정 항목으로 만들어져요.</p>}
        </fieldset>

        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ct-memo">메모</Label><Textarea id="ct-memo" className="min-h-20 bg-white" value={d.memo} maxLength={2000} disabled={busy} onChange={e => set("memo", e.target.value)} /></div>
        {error && <p className="text-sm font-medium text-[#B42323] sm:col-span-2" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
      <ConfirmDialog open={confirmCancel} onOpenChange={setConfirmCancel} danger title="계약을 취소할까요?"
        description="아직 입금되지 않은 계약금·잔금 예정은 미수금·입금 예정 집계에서 빠져요. 이미 입금 확인된 내역은 그대로 남아요."
        confirmLabel="계약 취소" onConfirm={async () => { await save(); }} />
    </>
  );
}
