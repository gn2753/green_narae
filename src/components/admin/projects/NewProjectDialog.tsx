"use client";
import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo, useSettings } from "@/data/hooks";
import { DEFAULT_SETTINGS, STAGE_ORDER, stageLabel } from "@/domain/defaults";
import type { ISODate, Project, StageKey } from "@/domain/types";
import { createProjectWithCustomer } from "@/services/projectService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { DateField } from "@/components/common/DateField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const FORM_ID = "new-project-form";
type Mode = "existing" | "new";
interface Draft {
  mode: Mode; customerId: string; name: string; company: string; phone: string;
  title: string; signType: string; siteAddress: string; dueDate: ISODate | ""; stage: StageKey;
}

/** ＋ 새 의뢰: 기존 고객 선택 또는 새 고객 입력 → 의뢰 생성(시작 단계 기본 상담·실측). `onCreated`를 주면 닫기는 부모가 맡는다. */
export function NewProjectDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: (p: Project) => void }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const { items: customers } = useCollection("customers");
  const { run, busy } = useMutation();
  const init = (): Draft => ({ mode: "existing", customerId: "", name: "", company: "", phone: "", title: "", signType: settings.signTypes[0] ?? "", siteAddress: "", dueDate: "", stage: "measure" });
  const [d, setD] = useState<Draft>(init);
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(init()); setError(""); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const customerOptions = useMemo(() => [
    { value: "", label: "고객을 선택하세요" },
    ...[...customers].sort((a, b) => a.name.localeCompare(b.name, "ko")).map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""} · ${formatPhone(c.phone)}` })),
  ], [customers]);
  const selected = customers.find(c => c.id === d.customerId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (d.mode === "existing" && !d.customerId) { setError("고객을 선택하거나 새 고객을 입력해주세요."); return; }
    if (d.mode === "new" && (!d.name.trim() || !d.phone.trim())) { setError("고객 이름과 연락처를 입력해주세요."); return; }
    if (!d.title.trim()) { setError("건명을 입력해주세요."); return; }
    if (!d.signType) { setError("간판 종류를 선택해주세요."); return; }
    setError("");
    const r = await run(() => createProjectWithCustomer(repo, {
      ...(d.mode === "existing" ? { customerId: d.customerId } : { newCustomer: { name: d.name, company: d.company, phone: d.phone, site: d.siteAddress } }),
      title: d.title, signType: d.signType, ...(d.siteAddress.trim() ? { siteAddress: d.siteAddress.trim() } : {}), ...(d.dueDate ? { dueDate: d.dueDate } : {}), stage: d.stage,
    }, admin.id), undefined, { exclusive: true });
    if (!r) return;
    toast.success(r.reusedCustomer ? `같은 연락처의 고객(${r.customer.name})에 의뢰를 연결했어요` : "새 의뢰를 등록했어요");
    if (onCreated) onCreated(r.project); // 부모가 닫기까지 처리(주소 쿼리를 한 번에 바꾸도록)
    else onOpenChange(false);
  };

  const seg = (m: Mode, label: string) => (
    <button type="button" role="radio" aria-checked={d.mode === m} onClick={() => set("mode", m)} disabled={busy}
      className={cn("min-h-10 flex-1 rounded-md px-3 text-sm md:min-h-8", d.mode === m ? "bg-white font-bold text-[#1F2A24] shadow-sm" : "text-[#5F6B64]")}>{label}</button>
  );
  const req = <span className="text-[#D64545]" aria-hidden>*</span>;

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="lg" title="새 의뢰" description="고객과 간판 일을 등록하면 의뢰 진행 보드에 카드가 생겨요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "등록 중…" : "의뢰 등록"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium">고객 {req}</legend>
          <div role="radiogroup" aria-label="고객 입력 방식" className="flex rounded-lg bg-[#EEF1EF] p-0.5">{seg("existing", "기존 고객")}{seg("new", "새 고객")}</div>
          {d.mode === "existing" ? (
            <>
              <TaskSelect label="고객 선택" value={d.customerId} options={customerOptions} disabled={busy} onChange={v => setD(x => ({ ...x, customerId: v, siteAddress: x.siteAddress || (customers.find(c => c.id === v)?.sites[0] ?? "") }))} />
              {selected?.sites.length ? <p className="text-xs text-[#5F6B64]">대표 현장: {selected.sites[0]}</p> : null}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label htmlFor="np-name">이름 {req}</Label><Input id="np-name" className="h-11 bg-white md:h-10" value={d.name} maxLength={40} disabled={busy} onChange={e => set("name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="np-company">업체명</Label><Input id="np-company" className="h-11 bg-white md:h-10" value={d.company} maxLength={60} disabled={busy} onChange={e => set("company", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="np-phone">연락처 {req}</Label><Input id="np-phone" type="tel" inputMode="tel" className="h-11 bg-white md:h-10" value={d.phone} maxLength={20} placeholder="010-0000-0000" disabled={busy} onChange={e => set("phone", e.target.value)} /></div>
              <p className="text-xs text-[#5F6B64] sm:col-span-3">같은 연락처의 고객이 이미 있으면 그 고객에 연결돼요.</p>
            </div>
          )}
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="np-title">건명 {req}</Label>
          <Input id="np-title" className="h-11 bg-white md:h-10" value={d.title} maxLength={120} placeholder="예: 온담카페 채널간판" required disabled={busy} onChange={e => set("title", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="np-sign">간판 종류 {req}</Label>
            <TaskSelect id="np-sign" label="간판 종류" value={d.signType} options={settings.signTypes.map(s => ({ value: s, label: s }))} disabled={busy} onChange={v => set("signType", v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-stage">시작 단계</Label>
            <TaskSelect id="np-stage" label="시작 단계" value={d.stage} options={STAGE_ORDER.map(k => ({ value: k, label: stageLabel(settings, k) }))} disabled={busy} onChange={v => set("stage", v as StageKey)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="np-site">현장 주소</Label>
            <Input id="np-site" className="h-11 bg-white md:h-10" value={d.siteAddress} maxLength={120} placeholder="세종특별자치시 ○○로 00" disabled={busy} onChange={e => set("siteAddress", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-due">마감일</Label>
            <DateField id="np-due" min="2000-01-01" max="2100-12-31" value={d.dueDate} disabled={busy} onChange={v => set("dueDate", v)} />
          </div>
        </div>
        {error && <p className="text-sm font-medium text-[#B42323]" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
