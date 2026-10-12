"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { NewDoc } from "@/data/repository";
import { useAdmin, useCollection, useMutation, useRepo, useToday } from "@/data/hooks";
import { PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { activePayments, isProjectSettled } from "@/domain/money";
import type { Attachment, ISODate, LedgerEntry, Payment } from "@/domain/types";
import { confirmPayment } from "@/services/moneyService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { DateField } from "@/components/common/DateField";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { Label } from "@/components/ui/label";
import { formatWon } from "@/lib/format";

const FORM_ID = "confirm-payment-form";

/** 입금 확인: 입금일(기본 오늘) · 이체 증빙 · 확인자. 저장 뒤 매출 초안을 돌려주고, 의뢰가 모두 정산되면 안내한다. */
export function ConfirmPaymentDialog({ payment, open, onOpenChange, onConfirmed }: {
  payment: Payment | null; open: boolean; onOpenChange: (o: boolean) => void;
  onConfirmed: (ledgerDraft: NewDoc<LedgerEntry>) => void;
}) {
  const repo = useRepo();
  const today = useToday();
  const { admin } = useAdmin();
  const { items: projects } = useCollection("projects");
  const { items: customers } = useCollection("customers");
  const { run, busy } = useMutation();
  const [paidOn, setPaidOn] = useState<ISODate | "">(today);
  const [proof, setProof] = useState<Attachment | undefined>();
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setPaidOn(today); setProof(undefined); } }

  const [last, setLast] = useState<Payment | null>(payment);
  if (payment && payment !== last) setLast(payment);
  const shown = payment ?? last;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !admin || busy) return;
    if (!paidOn) { toast.error("입금일을 입력해주세요."); return; }
    const r = await run(() => confirmPayment(repo, payment.id, { paidOn, proof }, admin.id), "입금을 확인했어요", { exclusive: true });
    if (!r) return;
    onOpenChange(false);
    if (r.payment.projectId && isProjectSettled(activePayments(await repo.list("payments"), await repo.list("contracts")), r.payment.projectId)) {
      const title = projects.find(p => p.id === r.payment.projectId)?.title ?? "의뢰";
      toast.success(`${title} 의뢰가 정산 완료되었어요`);
    }
    onConfirmed(r.ledgerDraft);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="sm" title="입금 확인"
      description={shown ? `${customers.find(c => c.id === shown.customerId)?.name ?? "고객"} · ${PAYMENT_KIND_LABEL[shown.kind]} ${formatWon(shown.amount)}` : undefined}
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "확인 중…" : "입금 확인"}
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="cp-date">입금일</Label><DateField id="cp-date" value={paidOn} disabled={busy} onChange={setPaidOn} /></div>
        <div className="space-y-2"><Label>이체 증빙 (이미지·PDF)</Label>
          <AttachmentGallery items={proof ? [proof] : []} onRemove={() => setProof(undefined)} emptyText="첨부한 증빙이 없어요." />
          <AttachmentPicker label={proof ? "증빙 바꾸기" : "증빙 첨부"} disabled={busy} onAdd={a => { if (a[0]) setProof(a[0]); }} />
        </div>
        <p className="text-sm text-[#5F6B64]">확인자: <b className="text-[#1F2A24]">{admin ? `${admin.name} ${admin.title}` : "확인 중…"}</b></p>
      </form>
    </ResponsiveDialog>
  );
}
