"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAdmin, useMutation, useRepo } from "@/data/hooks";
import { SOURCE_LABEL } from "@/domain/defaults";
import type { Inquiry, InquirySource } from "@/domain/types";
import { createManualInquiry } from "@/services/inquiryService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FORM_ID = "manual-inquiry-form";
const SOURCES = (Object.keys(SOURCE_LABEL) as InquirySource[]).filter(s => s !== "web");
const SOURCE_OPTIONS = SOURCES.map(s => ({ value: s, label: SOURCE_LABEL[s] }));
interface Draft { name: string; phone: string; email: string; message: string; source: InquirySource }
const EMPTY: Draft = { name: "", phone: "", email: "", message: "", source: "phone" };

/** ＋ 문의 등록: 전화·카톡·방문·메일로 받은 문의를 수기로 기록. */
export function ManualInquiryDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (q: Inquiry) => void }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const [d, setD] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(EMPTY); setError(""); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (!d.name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!d.phone.trim()) { setError("연락처를 입력해주세요."); return; }
    if (!d.message.trim()) { setError("문의 내용을 입력해주세요."); return; }
    setError("");
    const q = await run(() => createManualInquiry(repo, d, admin.id), "문의를 등록했어요", { exclusive: true });
    if (q) onCreated(q);
  };
  const req = <span className="text-[#D64545]" aria-hidden>*</span>;

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="lg" title="문의 등록" description="전화·카톡·방문·메일로 받은 문의를 기록해요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "등록 중…" : "문의 등록"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="mi-name">이름 {req}</Label><Input id="mi-name" className="h-11 bg-white md:h-10" value={d.name} maxLength={40} disabled={busy} onChange={e => set("name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="mi-phone">연락처 {req}</Label><Input id="mi-phone" type="tel" inputMode="tel" className="h-11 bg-white md:h-10" value={d.phone} maxLength={20} placeholder="010-0000-0000" disabled={busy} onChange={e => set("phone", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="mi-email">이메일</Label><Input id="mi-email" type="email" className="h-11 bg-white md:h-10" value={d.email} maxLength={80} disabled={busy} onChange={e => set("email", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="mi-source">경로</Label><TaskSelect id="mi-source" label="문의 경로" value={d.source} options={SOURCE_OPTIONS} disabled={busy} onChange={v => set("source", v as InquirySource)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="mi-msg">문의 내용 {req}</Label><Textarea id="mi-msg" className="min-h-28 bg-white" value={d.message} maxLength={2000} disabled={busy} onChange={e => set("message", e.target.value)} /></div>
        {error && <p className="text-sm font-medium text-[#B42323] sm:col-span-2" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
