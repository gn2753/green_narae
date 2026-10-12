"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { NewDoc } from "@/data/repository";
import { useCollection, useMutation, useRepo, useSettings } from "@/data/hooks";
import { splitVat } from "@/domain/money";
import type { LedgerEntry } from "@/domain/types";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DateField } from "@/components/common/DateField";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWon } from "@/lib/format";

const FORM_ID = "ledger-suggest-form";

interface Draft { date: string; auto: boolean; gross: number; amount: number; vat: number; category: string; memo: string }
const init = (d: NewDoc<LedgerEntry> | null): Draft => ({ date: d?.date ?? "", auto: true, gross: (d?.amount ?? 0) + (d?.vat ?? 0), amount: d?.amount ?? 0, vat: d?.vat ?? 0, category: d?.category ?? "", memo: d?.memo ?? "" });

/**
 * 입금 확인(매출)·발주 수령(매입) 뒤에 매입매출(A06) 등록을 제안하는 창.
 * 초안을 확인·수정한 뒤 `등록`하면 `repo.create("ledger", …)`, `건너뛰기`는 아무것도 저장하지 않는다.
 */
export function LedgerSuggestDialog({ draft, open, onOpenChange }: { draft: NewDoc<LedgerEntry> | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const repo = useRepo();
  const settings = useSettings();
  const { items: customers } = useCollection("customers");
  const { items: vendors } = useCollection("vendors");
  const { items: projects } = useCollection("projects");
  const { items: ledger } = useCollection("ledger");
  const { run, busy } = useMutation();
  const [d, setD] = useState<Draft>(() => init(draft));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) setD(init(draft)); }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const isPurchase = draft?.type === "purchase";
  const counterparty = draft?.customerId ? customers.find(c => c.id === draft.customerId)?.name : draft?.vendorId ? vendors.find(v => v.id === draft.vendorId)?.name : undefined;
  const project = draft?.projectId ? projects.find(p => p.id === draft.projectId)?.title : undefined;
  const categories = settings?.purchaseCategories ?? [];
  const catOptions = (categories.includes(d.category) || !d.category ? categories : [d.category, ...categories]).map(c => ({ value: c, label: c }));
  const shown = d.auto ? splitVat(d.gross) : { amount: d.amount, vat: d.vat };
  const duplicate = !!draft?.sourceRef && ledger.some(e => e.sourceRef?.kind === draft.sourceRef?.kind && e.sourceRef?.id === draft.sourceRef?.id);
  const typeLabel = isPurchase ? "매입" : "매출";
  const asType = isPurchase ? "매입으로" : "매출로"; // 받침에 맞는 조사

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || busy) return;
    if (shown.amount + shown.vat <= 0) { toast.error("금액을 입력해주세요."); return; }
    if (!d.date) { toast.error("날짜를 입력해주세요."); return; }
    const entry: NewDoc<LedgerEntry> = { ...draft, date: d.date, amount: shown.amount, vat: shown.vat, memo: d.memo.trim() || undefined, ...(isPurchase ? { category: d.category || undefined } : {}) };
    const ok = await run(() => repo.create("ledger", entry), `${asType} 등록했어요 (매입·매출 A06에서 확인)`, { exclusive: true });
    if (ok) onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="md" title={`${asType} 등록할까요?`}
      description="아래 내용으로 매입·매출 내역을 만들어요. 필요하면 고친 뒤 등록하세요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">건너뛰기</button>
        <button type="submit" form={FORM_ID} disabled={busy || !draft} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "등록 중…" : "등록"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {duplicate && <p role="status" className="rounded-lg bg-[#FFF4D6] px-3 py-2 text-sm text-[#8A6400] sm:col-span-2">이 건은 이미 매입·매출에 등록돼 있어요. 또 등록하면 중복돼요.</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-[#F6F7F5] p-3 text-sm sm:col-span-2">
          <dt className="text-[#5F6B64]">구분</dt><dd className="font-bold">{typeLabel}</dd>
          <dt className="text-[#5F6B64]">{isPurchase ? "업체" : "고객"}</dt><dd>{counterparty ?? "-"}</dd>
          <dt className="text-[#5F6B64]">의뢰</dt><dd>{project ?? "-"}</dd>
        </dl>
        <div className="space-y-1.5"><Label htmlFor="ls-date">날짜</Label><DateField id="ls-date" value={d.date} disabled={busy} onChange={v => set("date", v)} /></div>
        {isPurchase
          ? <div className="space-y-1.5"><Label htmlFor="ls-cat">비용 항목</Label><TaskSelect id="ls-cat" label="비용 항목" value={d.category} options={catOptions} disabled={busy} onChange={v => set("category", v)} /></div>
          : <div className="hidden sm:block" />}
        {d.auto ? (
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ls-gross">합계 금액 (부가세 포함)</Label><MoneyInput id="ls-gross" value={d.gross} disabled={busy} onChange={v => set("gross", v)} />
            <p className="text-xs text-[#5F6B64]">공급가액 {formatWon(shown.amount)} + 부가세 {formatWon(shown.vat)}</p></div>
        ) : (
          <>
            <div className="space-y-1.5"><Label htmlFor="ls-amount">공급가액</Label><MoneyInput id="ls-amount" value={d.amount} disabled={busy} onChange={v => set("amount", v)} /></div>
            <div className="space-y-1.5"><Label htmlFor="ls-vat">부가세</Label><MoneyInput id="ls-vat" value={d.vat} disabled={busy} onChange={v => set("vat", v)} /></div>
          </>
        )}
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2 md:min-h-9">
          <input type="checkbox" className="size-4 accent-[#2F8F57]" checked={d.auto} disabled={busy}
            onChange={e => setD(x => e.target.checked ? { ...x, auto: true, gross: x.amount + x.vat } : { ...x, auto: false, ...splitVat(x.gross) })} />
          부가세 10% 자동 분리
        </label>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ls-memo">메모</Label><Input id="ls-memo" className="h-11 bg-white md:h-10" value={d.memo} maxLength={200} disabled={busy} onChange={e => set("memo", e.target.value)} /></div>
      </form>
    </ResponsiveDialog>
  );
}
