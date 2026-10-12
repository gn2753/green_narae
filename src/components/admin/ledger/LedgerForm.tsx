"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ConflictError } from "@/data/errors";
import { useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { splitVat } from "@/domain/money";
import type { ISODate, LedgerEntry } from "@/domain/types";
import { saveLedgerEntry } from "@/services/moneyService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DateField } from "@/components/common/DateField";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWon } from "@/lib/format";

const FORM_ID = "ledger-form";
const NONE = "none";
interface Draft { date: ISODate | ""; party: string; projectId: string; category: string; auto: boolean; gross: number; amount: number; vat: number; memo: string }

/** 매입·매출 직접 등록·수정. 부가세는 합계에서 10% 자동 분리(해제하면 직접 입력). */
export function LedgerForm({ open, type, entry, onOpenChange }: { open: boolean; type: "purchase" | "sale"; entry: LedgerEntry | null; onOpenChange: (o: boolean) => void }) {
  const repo = useRepo();
  const today = useToday();
  const settings = useSettings();
  const { items: vendors } = useCollection("vendors");
  const { items: customers } = useCollection("customers");
  const { items: projects } = useCollection("projects");
  const { run, busy } = useMutation();
  const isPurchase = type === "purchase";
  const init = (e: LedgerEntry | null = entry): Draft => e
    ? { date: e.date, party: (isPurchase ? e.vendorId : e.customerId) ?? NONE, projectId: e.projectId ?? NONE, category: e.category ?? "", auto: splitVat(e.amount + e.vat).vat === e.vat, gross: e.amount + e.vat, amount: e.amount, vat: e.vat, memo: e.memo ?? "" }
    : { date: today, party: NONE, projectId: NONE, category: settings?.purchaseCategories[0] ?? "", auto: true, gross: 0, amount: 0, vat: 0, memo: "" };
  const [d, setD] = useState<Draft>(init);
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const [base, setBase] = useState(entry); // 열 때의 버전을 기준으로 저장(충돌 안내)
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(init()); setError(""); setBase(entry); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const cats = settings?.purchaseCategories ?? [];
  const catOptions = (cats.includes(d.category) || !d.category ? cats : [d.category, ...cats]).map(c => ({ value: c, label: c }));
  const partyOptions = [{ value: NONE, label: isPurchase ? "업체 선택 안 함" : "고객 선택 안 함" }, ...(isPurchase ? vendors : customers).map(p => ({ value: p.id, label: p.name }))];
  const projectOptions = [{ value: NONE, label: "의뢰 연결 안 함" }, ...projects.filter(p => p.status === "active" || p.id === d.projectId).map(p => ({ value: p.id, label: p.title }))];
  const shown = d.auto ? splitVat(d.gross) : { amount: d.amount, vat: d.vat };
  const label = isPurchase ? "매입" : "매출";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (shown.amount <= 0) { setError("금액을 입력해주세요."); return; }
    if (!d.date) { setError("날짜를 입력해주세요."); return; }
    if (isPurchase && !d.category) { setError("비용 항목을 선택해주세요."); return; }
    setError("");
    const saved = await run(() => saveLedgerEntry(repo, {
      type, date: d.date as ISODate, amount: shown.amount, vat: shown.vat, memo: d.memo,
      projectId: d.projectId === NONE ? null : d.projectId,
      ...(isPurchase ? { category: d.category, vendorId: d.party === NONE ? undefined : d.party } : { customerId: d.party === NONE ? undefined : d.party }),
      ...(entry?.sourceRef ? { sourceRef: entry.sourceRef } : {}),
    }, entry && base?.id === entry.id ? base : entry).catch(async er => {
      if (er instanceof ConflictError && entry) { const latest = await repo.get("ledger", entry.id); if (latest) { setBase(latest); setD(init(latest)); } }
      throw er;
    }), entry ? `${label} 내역을 저장했어요` : `${label}을 등록했어요`, { exclusive: true });
    if (saved) onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="md" title={entry ? `${label} 수정` : `${label} 등록`}
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="lg-date">날짜</Label><DateField id="lg-date" value={d.date} disabled={busy} onChange={v => set("date", v)} /></div>
        {isPurchase
          ? <div className="space-y-1.5"><Label htmlFor="lg-cat">비용 항목</Label><TaskSelect id="lg-cat" label="비용 항목" value={d.category} options={catOptions} disabled={busy} onChange={v => set("category", v)} /></div>
          : <div className="hidden sm:block" />}
        <div className="space-y-1.5"><Label htmlFor="lg-party">{isPurchase ? "업체" : "고객"}</Label><TaskSelect id="lg-party" label={isPurchase ? "업체" : "고객"} value={d.party} options={partyOptions} disabled={busy} onChange={v => set("party", v)} /></div>
        <div className="space-y-1.5"><Label htmlFor="lg-project">의뢰</Label><TaskSelect id="lg-project" label="의뢰" value={d.projectId} options={projectOptions} disabled={busy} onChange={v => set("projectId", v)} /></div>
        {d.auto ? (
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="lg-gross">합계 금액 (부가세 포함)</Label><MoneyInput id="lg-gross" value={d.gross} disabled={busy} onChange={v => set("gross", v)} />
            <p className="text-xs text-[#5F6B64]">공급가액 {formatWon(shown.amount)} + 부가세 {formatWon(shown.vat)}</p></div>
        ) : (
          <>
            <div className="space-y-1.5"><Label htmlFor="lg-amount">공급가액</Label><MoneyInput id="lg-amount" value={d.amount} disabled={busy} onChange={v => set("amount", v)} /></div>
            <div className="space-y-1.5"><Label htmlFor="lg-vat">부가세</Label><MoneyInput id="lg-vat" value={d.vat} disabled={busy} onChange={v => set("vat", v)} /></div>
          </>
        )}
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2 md:min-h-9">
          <input type="checkbox" className="size-4 accent-[#2F8F57]" checked={d.auto} disabled={busy}
            onChange={e => setD(x => e.target.checked ? { ...x, auto: true, gross: x.amount + x.vat } : { ...x, auto: false, ...splitVat(x.gross) })} />
          부가세 10% 자동 분리
        </label>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="lg-memo">메모</Label><Input id="lg-memo" className="h-11 bg-white md:h-10" value={d.memo} maxLength={200} disabled={busy} onChange={e => set("memo", e.target.value)} /></div>
        {error && <p role="alert" className="text-sm font-bold text-[#B42323] sm:col-span-2">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
