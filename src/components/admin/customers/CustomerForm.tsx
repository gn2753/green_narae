"use client";
import { useState } from "react";
import { LoaderCircle, Plus, TriangleAlert, X } from "lucide-react";
import { useCollection, useMutation, useRepo } from "@/data/hooks";
import { ConflictError } from "@/data/errors";
import { findCustomerByPhone } from "@/domain/inquiries";
import type { Customer } from "@/domain/types";
import { saveCustomer } from "@/services/customerService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FORM_ID = "customer-form";
interface Draft { name: string; company: string; phone: string; email: string; sites: string[]; memo: string }
const fromCustomer = (c: Customer | null): Draft => ({ name: c?.name ?? "", company: c?.company ?? "", phone: c?.phone ?? "", email: c?.email ?? "", sites: c?.sites.length ? [...c.sites] : [""], memo: c?.memo ?? "" });

/** 고객 등록·수정. 연락처가 겹치면 경고만 하고 저장은 가능. */
export function CustomerForm({ open, customer, onOpenChange, onSaved }: { open: boolean; customer: Customer | null; onOpenChange: (o: boolean) => void; onSaved: (c: Customer) => void }) {
  const repo = useRepo();
  const { items: customers } = useCollection("customers");
  const { run, busy } = useMutation();
  const [d, setD] = useState<Draft>(() => fromCustomer(customer));
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const [base, setBase] = useState(customer); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(fromCustomer(customer)); setError(""); setBase(customer); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));
  const setSite = (i: number, v: string) => setD(x => ({ ...x, sites: x.sites.map((s, j) => (j === i ? v : s)) }));

  const dup = d.phone.trim() ? findCustomerByPhone(customers.filter(c => c.id !== customer?.id), d.phone) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!d.name.trim()) { setError("고객명을 입력해주세요."); return; }
    if (!d.phone.trim()) { setError("연락처를 입력해주세요."); return; }
    setError("");
    const saved = await run(() => saveCustomer(repo, d, customer && base?.id === customer.id ? base : customer).catch(async er => {
      // 충돌이면 최신 내용으로 입력칸을 다시 채운다(안내 문구와 일치)
      if (er instanceof ConflictError && customer) { const latest = await repo.get("customers", customer.id); if (latest) { setBase(latest); setD(fromCustomer(latest)); } }
      throw er;
    }), customer ? "고객 정보를 저장했어요" : "고객을 등록했어요", { exclusive: true });
    if (saved) onSaved(saved);
  };
  const req = <span className="text-[#D64545]" aria-hidden>*</span>;

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="lg" title={customer ? "고객 정보 수정" : "고객 등록"}
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : customer ? "저장" : "고객 등록"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="cf-name">고객명 {req}</Label><Input id="cf-name" className="h-11 bg-white md:h-10" value={d.name} maxLength={40} disabled={busy} onChange={e => set("name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="cf-company">업체명</Label><Input id="cf-company" className="h-11 bg-white md:h-10" value={d.company} maxLength={60} disabled={busy} onChange={e => set("company", e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-phone">연락처 {req}</Label>
          <Input id="cf-phone" type="tel" inputMode="tel" className="h-11 bg-white md:h-10" value={d.phone} maxLength={20} placeholder="010-0000-0000" disabled={busy} onChange={e => set("phone", e.target.value)} aria-describedby={dup ? "cf-dup" : undefined} />
          {dup && <p id="cf-dup" role="status" className="flex items-start gap-1.5 rounded-lg bg-[#FFF4D6] px-3 py-2 text-sm text-[#8A6400]"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />같은 연락처의 고객이 있어요: {dup.name}</p>}
        </div>
        <div className="space-y-1.5"><Label htmlFor="cf-email">이메일</Label><Input id="cf-email" type="email" className="h-11 bg-white md:h-10" value={d.email} maxLength={80} disabled={busy} onChange={e => set("email", e.target.value)} /></div>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">현장 주소</legend>
          {d.sites.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`현장 주소 ${i + 1}`} className="h-11 bg-white md:h-10" value={s} maxLength={120} disabled={busy} placeholder="예) 서울 마포구 ○○로 12, 1층" onChange={e => setSite(i, e.target.value)} />
              <button type="button" aria-label={`현장 주소 ${i + 1} 삭제`} disabled={busy} onClick={() => setD(x => ({ ...x, sites: x.sites.length > 1 ? x.sites.filter((_, j) => j !== i) : [""] }))}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white text-[#56645C] hover:bg-[#F6F7F5] md:size-10"><X className="size-4" aria-hidden /></button>
            </div>
          ))}
          <button type="button" disabled={busy} onClick={() => setD(x => ({ ...x, sites: [...x.sites, ""] }))} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-dashed border-[#B9C4BD] px-3 text-sm font-medium text-brand hover:bg-[#F6F7F5] md:min-h-9"><Plus className="size-4" aria-hidden />현장 주소 추가</button>
        </fieldset>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cf-memo">메모</Label><Textarea id="cf-memo" className="min-h-24 bg-white" value={d.memo} maxLength={2000} disabled={busy} onChange={e => set("memo", e.target.value)} /></div>
        {error && <p className="text-sm font-medium text-[#B42323] sm:col-span-2" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
