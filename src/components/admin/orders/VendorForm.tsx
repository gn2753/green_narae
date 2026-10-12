"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ConflictError } from "@/data/errors";
import { useCollection, useMutation, useRepo, useSettings } from "@/data/hooks";
import type { Vendor } from "@/domain/types";
import { saveVendor } from "@/services/moneyService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FORM_ID = "vendor-form";
interface Draft { name: string; field: string; contactName: string; phone: string; memo: string }
const from = (v: Vendor | null, field: string): Draft => ({ name: v?.name ?? "", field: v?.field ?? field, contactName: v?.contactName ?? "", phone: v?.phone ?? "", memo: v?.memo ?? "" });

/** 제작업체 등록·수정 */
export function VendorForm({ open, vendor, onOpenChange, onSaved }: { open: boolean; vendor: Vendor | null; onOpenChange: (o: boolean) => void; onSaved?: (v: Vendor) => void }) {
  const repo = useRepo();
  const settings = useSettings();
  const { items: vendors } = useCollection("vendors");
  const { run, busy } = useMutation();
  const fields = settings?.vendorFields ?? [];
  const [d, setD] = useState<Draft>(() => from(vendor, fields[0] ?? ""));
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const [base, setBase] = useState(vendor); // 열 때의 버전을 기준으로 저장(충돌 안내)
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(from(vendor, fields[0] ?? "")); setError(""); setBase(vendor); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));
  const options = (fields.includes(d.field) || !d.field ? fields : [d.field, ...fields]).map(f => ({ value: f, label: f }));
  const dup = vendors.some(v => v.id !== vendor?.id && v.name === d.name.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!d.name.trim()) { setError("업체명을 입력해주세요."); return; }
    setError("");
    const saved = await run(() => saveVendor(repo, { name: d.name, field: d.field, contactName: d.contactName, phone: d.phone, memo: d.memo }, vendor && base?.id === vendor.id ? base : vendor).catch(async er => {
      if (er instanceof ConflictError && vendor) { const latest = await repo.get("vendors", vendor.id); if (latest) { setBase(latest); setD(from(latest, fields[0] ?? "")); } }
      throw er;
    }), vendor ? "업체 정보를 저장했어요" : "업체를 등록했어요", { exclusive: true });
    if (saved) { onOpenChange(false); onSaved?.(saved); }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="md" title={vendor ? "업체 수정" : "새 업체 등록"}
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="vd-name">업체명</Label><Input id="vd-name" className="h-11 bg-white md:h-10" value={d.name} maxLength={60} disabled={busy} onChange={e => set("name", e.target.value)} />
          {dup && <p className="text-xs text-[#8A6400]">같은 이름의 업체가 이미 있어요.</p>}</div>
        <div className="space-y-1.5"><Label htmlFor="vd-field">분야</Label><TaskSelect id="vd-field" label="분야" value={d.field} options={options} disabled={busy} onChange={v => set("field", v)} /></div>
        <div className="space-y-1.5"><Label htmlFor="vd-contact">담당자</Label><Input id="vd-contact" className="h-11 bg-white md:h-10" value={d.contactName} maxLength={30} disabled={busy} onChange={e => set("contactName", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="vd-phone">연락처</Label><Input id="vd-phone" type="tel" inputMode="tel" className="h-11 bg-white md:h-10" value={d.phone} maxLength={30} disabled={busy} onChange={e => set("phone", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="vd-memo">메모</Label><Textarea id="vd-memo" rows={3} value={d.memo} maxLength={500} disabled={busy} onChange={e => set("memo", e.target.value)} /></div>
        {error && <p role="alert" className="text-sm font-bold text-[#B42323] sm:col-span-2">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
