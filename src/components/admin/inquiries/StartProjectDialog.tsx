"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo, useSettings } from "@/data/hooks";
import { DEFAULT_SETTINGS } from "@/domain/defaults";
import { findCustomerByPhone } from "@/domain/inquiries";
import type { Inquiry, ISODate } from "@/domain/types";
import { startProjectFromInquiry } from "@/services/inquiryService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { DateField } from "@/components/common/DateField";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const FORM_ID = "start-project-form";
type Mode = "existing" | "new";
interface Draft { mode: Mode; customerId: string; name: string; company: string; phone: string; email: string; site: string; title: string; signType: string; dueDate: ISODate | "" }

/** 고객 등록 + 의뢰 시작: 문의 값으로 새 고객 칸을 미리 채우고, 같은 연락처 고객이 있으면 기존 고객을 먼저 고른다. */
export function StartProjectDialog({ open, onOpenChange, inquiry, presetCustomerId }: { open: boolean; onOpenChange: (o: boolean) => void; inquiry: Inquiry; presetCustomerId?: string }) {
  const repo = useRepo();
  const router = useRouter();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const { items: customers } = useCollection("customers");
  const { run, busy } = useMutation();
  const init = (): Draft => {
    const match = presetCustomerId ?? findCustomerByPhone(customers, inquiry.phone)?.id ?? "";
    return { mode: match ? "existing" : "new", customerId: match, name: inquiry.name, company: "", phone: inquiry.phone, email: inquiry.email ?? "", site: "", title: "", signType: settings.signTypes[0] ?? "", dueDate: "" };
  };
  const [d, setD] = useState<Draft>(init);
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(init()); setError(""); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const customerOptions = useMemo(() => [
    { value: "", label: "고객을 선택하세요" },
    ...[...customers].sort((a, b) => a.name.localeCompare(b.name, "ko")).map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""} · ${formatPhone(c.phone)}` })),
  ], [customers]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (d.mode === "existing" && !d.customerId) { setError("고객을 선택하거나 새 고객을 입력해주세요."); return; }
    if (d.mode === "new" && (!d.name.trim() || !d.phone.trim())) { setError("고객 이름과 연락처를 입력해주세요."); return; }
    if (!d.title.trim()) { setError("건명을 입력해주세요."); return; }
    if (!d.signType) { setError("간판 종류를 선택해주세요."); return; }
    setError("");
    const r = await run(() => startProjectFromInquiry(repo, inquiry.id, {
      ...(d.mode === "existing" ? { customerId: d.customerId } : { newCustomer: { name: d.name, company: d.company, phone: d.phone, email: d.email, site: d.site } }),
      title: d.title, signType: d.signType, ...(d.dueDate ? { dueDate: d.dueDate } : {}),
    }, admin.id), undefined, { exclusive: true });
    if (!r) return;
    onOpenChange(false);
    toast.success(`${r.customer.name} 고객의 의뢰를 시작했어요`, { action: { label: "의뢰 진행 보드에서 보기", onClick: () => router.push(`/admin/projects?id=${r.project.id}`) } });
  };

  const seg = (m: Mode, label: string) => (
    <button type="button" role="radio" aria-checked={d.mode === m} onClick={() => set("mode", m)} disabled={busy}
      className={cn("min-h-10 flex-1 rounded-md px-3 text-sm md:min-h-8", d.mode === m ? "bg-white font-bold text-[#1F2A24] shadow-sm" : "text-[#5F6B64]")}>{label}</button>
  );
  const req = <span className="text-[#D64545]" aria-hidden>*</span>;
  const f = (id: string, label: string, key: "name" | "company" | "phone" | "email" | "site", opts: { required?: boolean; type?: string; span?: boolean; placeholder?: string } = {}) => (
    <div className={cn("space-y-1.5", opts.span && "sm:col-span-2")}>
      <Label htmlFor={id}>{label} {opts.required && req}</Label>
      <Input id={id} type={opts.type} className="h-11 bg-white md:h-10" value={d[key]} maxLength={120} placeholder={opts.placeholder} disabled={busy} onChange={e => set(key, e.target.value)} />
    </div>
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="lg" title="고객 등록 + 의뢰 시작" description="고객을 연결하고 의뢰를 만들면 의뢰 진행 보드의 상담·실측 열에 카드가 생겨요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "등록 중…" : "고객 등록 + 의뢰 시작"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium">고객 {req}</legend>
          <div role="radiogroup" aria-label="고객 입력 방식" className="flex rounded-lg bg-[#EEF1EF] p-0.5">{seg("existing", "기존 고객")}{seg("new", "새 고객")}</div>
          {d.mode === "existing" ? (
            <TaskSelect label="고객 선택" value={d.customerId} options={customerOptions} disabled={busy} onChange={v => set("customerId", v)} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {f("sp-name", "이름", "name", { required: true })}
              {f("sp-company", "업체명", "company")}
              {f("sp-phone", "연락처", "phone", { required: true, type: "tel", placeholder: "010-0000-0000" })}
              {f("sp-email", "이메일", "email", { type: "email" })}
              {f("sp-site", "현장 주소", "site", { span: true, placeholder: "세종특별자치시 ○○로 00" })}
              <p className="text-xs text-[#5F6B64] sm:col-span-2">같은 연락처의 고객이 이미 있으면 그 고객에 연결돼요.</p>
            </div>
          )}
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="sp-title">건명 {req}</Label>
          <Input id="sp-title" className="h-11 bg-white md:h-10" value={d.title} maxLength={120} placeholder="예: 온담카페 채널간판" disabled={busy} onChange={e => set("title", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sp-sign">간판 종류 {req}</Label>
            <TaskSelect id="sp-sign" label="간판 종류" value={d.signType} options={settings.signTypes.map(s => ({ value: s, label: s }))} disabled={busy} onChange={v => set("signType", v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-due">마감일</Label>
            <DateField id="sp-due" min="2000-01-01" max="2100-12-31" value={d.dueDate} disabled={busy} onChange={v => set("dueDate", v)} />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-[#B42323]" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
