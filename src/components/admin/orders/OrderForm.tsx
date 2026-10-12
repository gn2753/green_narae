"use client";
import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { ConflictError } from "@/data/errors";
import { useAdmin, useCollection, useMutation, useRepo, useToday } from "@/data/hooks";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/domain/defaults";
import { addDays } from "@/domain/dates";
import type { ISODate, OrderStatus, PurchaseOrder } from "@/domain/types";
import { saveOrder } from "@/services/moneyService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DateField } from "@/components/common/DateField";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VendorForm } from "./VendorForm";

const FORM_ID = "order-form";
const NONE = "none";
interface Draft { projectId: string; vendorId: string; item: string; amount: number; orderedOn: ISODate | ""; dueDate: ISODate | ""; status: OrderStatus }

/** 발주 등록·수정. 업체가 없으면 `새 업체`로 바로 등록. 상태 되돌리기는 수정 폼에서만. */
export function OrderForm({ open, order, prefillProjectId, onOpenChange }: { open: boolean; order: PurchaseOrder | null; prefillProjectId?: string; onOpenChange: (o: boolean) => void }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const today = useToday();
  const { items: projects } = useCollection("projects");
  const { items: vendors } = useCollection("vendors");
  const { run, busy } = useMutation();
  const init = (o: PurchaseOrder | null = order): Draft => ({ projectId: o ? o.projectId ?? NONE : prefillProjectId ?? NONE, vendorId: o?.vendorId ?? "", item: o?.item ?? "", amount: o?.amount ?? 0, orderedOn: o?.orderedOn ?? today, dueDate: o?.dueDate ?? addDays(today, 14), status: o?.status ?? "requested" });
  const [d, setD] = useState<Draft>(init);
  const [error, setError] = useState("");
  const [vendorOpen, setVendorOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [base, setBase] = useState(order); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  if (open !== wasOpen) { setWasOpen(open); if (open) { setD(init()); setError(""); setBase(order); } }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  const projectOptions = [{ value: NONE, label: "의뢰 연결 안 함" }, ...projects
    .filter(p => p.status === "active" || p.id === d.projectId)
    .map(p => ({ value: p.id, label: p.title }))];
  const vendorOptions = [{ value: "", label: "업체 선택" }, ...vendors.map(v => ({ value: v.id, label: `${v.name} (${v.field})` }))];
  // 수령완료는 스텝(수령 → 매입 제안)에서만 올린다. 이미 수령완료인 발주만 폼에서 되돌릴 수 있다.
  const statusOptions = ORDER_STATUS_ORDER.filter(s => s !== "received" || order?.status === "received").map(s => ({ value: s, label: ORDER_STATUS_LABEL[s] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (!d.vendorId) { setError("업체를 선택해주세요. 없으면 `새 업체`로 등록하세요."); return; }
    if (!d.item.trim()) { setError("제작 품목을 입력해주세요."); return; }
    if (d.amount <= 0) { setError("발주 금액을 입력해주세요."); return; }
    if (!d.orderedOn || !d.dueDate) { setError("발주일과 납기를 입력해주세요."); return; }
    if (d.dueDate < d.orderedOn) { setError("납기는 발주일 이후여야 해요."); return; }
    setError("");
    const existing = order && base?.id === order.id ? base : order;
    const saved = await run(() => saveOrder(repo, {
      projectId: d.projectId === NONE ? null : d.projectId, vendorId: d.vendorId, item: d.item, amount: d.amount,
      orderedOn: d.orderedOn as ISODate, dueDate: d.dueDate as ISODate, status: d.status, receivedOn: existing?.receivedOn ?? null,
    }, existing, admin.id).catch(async er => {
      if (er instanceof ConflictError && order) { const latest = await repo.get("orders", order.id); if (latest) { setBase(latest); setD(init(latest)); } }
      throw er;
    }), order ? "발주를 저장했어요" : "발주를 등록했어요", { exclusive: true });
    if (saved) onOpenChange(false);
  };

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="md" title={order ? "발주 수정" : "발주 등록"}
        footer={<>
          <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
          <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
          </button>
        </>}>
        <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="od-project">의뢰</Label><TaskSelect id="od-project" label="의뢰" value={d.projectId} options={projectOptions} disabled={busy} onChange={v => set("projectId", v)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="od-vendor">업체</Label>
            <div className="flex items-center gap-2">
              <TaskSelect id="od-vendor" label="업체" value={d.vendorId} options={vendorOptions} disabled={busy} onChange={v => set("vendorId", v)} className="min-w-0 flex-1" />
              <button type="button" onClick={() => setVendorOpen(true)} disabled={busy} className="inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-bold text-[#1E6E41] hover:bg-[#F6F7F5] disabled:opacity-50 md:h-10"><Plus className="size-4" aria-hidden />새 업체</button>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="od-item">제작 품목</Label><Input id="od-item" className="h-11 bg-white md:h-10" value={d.item} maxLength={100} disabled={busy} onChange={e => set("item", e.target.value)} placeholder="예: 채널 문자 간판 제작" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="od-amount">발주 금액</Label><MoneyInput id="od-amount" value={d.amount} disabled={busy} onChange={v => set("amount", v)} /></div>
          <div className="space-y-1.5"><Label htmlFor="od-ordered">발주일</Label><DateField id="od-ordered" value={d.orderedOn} disabled={busy} onChange={v => set("orderedOn", v)} /></div>
          <div className="space-y-1.5"><Label htmlFor="od-due">납기</Label><DateField id="od-due" value={d.dueDate} min={d.orderedOn || undefined} disabled={busy} onChange={v => set("dueDate", v)} /></div>
          {order && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="od-status">상태</Label><TaskSelect id="od-status" label="상태" value={d.status} options={statusOptions} disabled={busy} onChange={v => set("status", v as OrderStatus)} /></div>}
          {error && <p role="alert" className="text-sm font-bold text-[#B42323] sm:col-span-2">{error}</p>}
        </form>
      </ResponsiveDialog>
      <VendorForm open={vendorOpen} vendor={null} onOpenChange={setVendorOpen} onSaved={v => set("vendorId", v.id)} />
    </>
  );
}
