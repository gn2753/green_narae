"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";
import { useCollection, useToday } from "@/data/hooks";
import { CONTRACT_STATUS_LABEL, PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { paymentStatus } from "@/domain/money";
import type { Contract } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateKo, formatDateTimeKo, formatWon } from "@/lib/format";
import { ContractForm } from "./ContractForm";
import { CONTRACT_TONE } from "./contractUtils";

const linkCls = "inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-bold text-[#1E6E41] hover:bg-[#F6F7F5] md:min-h-9";

/** 견적·계약 상세: 요약 · 연결 입금 항목 · 의뢰·고객 링크 · 활동. */
export function ContractDetail({ contract: c, backHref }: { contract: Contract; backHref: string }) {
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const { items: customers } = useCollection("customers");
  const { items: projects } = useCollection("projects");
  const { items: payments } = useCollection("payments");
  const { items: activities } = useCollection("activities");
  const customer = customers.find(x => x.id === c.customerId);
  const project = c.projectId ? projects.find(p => p.id === c.projectId) : undefined;
  const mine = payments.filter(p => p.contractId === c.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const acts = c.projectId ? activities.filter(a => a.projectId === c.projectId && a.type === "money").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8) : [];

  return (
    <>
      <PageHeader title={project?.title ?? `${customer?.name ?? "고객"} 견적·계약`} description={customer ? `${customer.name}${customer.company ? ` · ${customer.company}` : ""}` : undefined}
        back={{ href: backHref, label: "견적·계약 목록" }}
        actions={<button type="button" onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5]"><Pencil className="size-4" aria-hidden />수정</button>} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="요약" className="rounded-xl border border-[#E3E8E4] bg-white p-4 md:p-5">
          <h2 className="mb-3 text-sm font-bold">요약</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-[#5F6B64]">상태</dt><dd><StatusBadge tone={CONTRACT_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</StatusBadge></dd>
            <dt className="text-[#5F6B64]">견적 금액</dt><dd className="font-bold">{formatWon(c.quoteAmount)} <span className="font-normal text-[#7A867F]">{c.vatIncluded ? "(부가세 포함)" : "(부가세 별도)"}</span></dd>
            <dt className="text-[#5F6B64]">견적 발송일</dt><dd>{c.quoteSentOn ? formatDateKo(c.quoteSentOn) : "-"}</dd>
            <dt className="text-[#5F6B64]">계약 금액</dt><dd className="font-bold">{c.contractAmount !== undefined ? formatWon(c.contractAmount) : "-"}</dd>
            <dt className="text-[#5F6B64]">계약일</dt><dd>{c.signedOn ? formatDateKo(c.signedOn) : "-"}</dd>
            <dt className="text-[#5F6B64]">계약금</dt><dd>{c.deposit ? `${formatWon(c.deposit.amount)} · 예정 ${formatDateKo(c.deposit.dueDate)}` : "-"}</dd>
            <dt className="text-[#5F6B64]">잔금</dt><dd>{c.balance ? `${formatWon(c.balance.amount)} · 예정 ${formatDateKo(c.balance.dueDate)}` : "-"}</dd>
            {c.memo && <><dt className="text-[#5F6B64]">메모</dt><dd className="whitespace-pre-wrap">{c.memo}</dd></>}
          </dl>
          <div className="mt-4"><h3 className="mb-2 text-sm font-bold">견적서</h3><AttachmentGallery items={c.quoteFile ? [c.quoteFile] : []} emptyText="첨부한 견적서가 없어요." /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {project && <Link href={`/admin/projects?id=${project.id}`} className={linkCls}>의뢰 보기<ArrowRight className="size-4" aria-hidden /></Link>}
            {customer && <Link href={`/admin/customers?id=${customer.id}`} className={linkCls}>고객 보기<ArrowRight className="size-4" aria-hidden /></Link>}
          </div>
        </section>

        <div className="space-y-4">
          <section aria-label="연결 입금 항목" className="rounded-xl border border-[#E3E8E4] bg-white p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">연결 입금 항목</h2><Link href="/admin/payments" className="inline-flex min-h-11 items-center text-xs font-bold text-[#1E6E41] md:min-h-8">A07에서 보기</Link></div>
            {mine.length === 0 ? <p className="text-sm text-[#5F6B64]">{c.status === "signed" ? "연결된 입금 항목이 없어요." : "계약완료로 저장하면 계약금·잔금 입금 예정이 만들어져요."}</p> : (
              <ul className="divide-y divide-[#EEF1EF]">
                {mine.map(p => {
                  const st = paymentStatus(p, today);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <div><p className="font-bold">{PAYMENT_KIND_LABEL[p.kind]} {formatWon(p.amount)}</p><p className="text-xs text-[#5F6B64]">{p.paidOn ? `입금일 ${formatDateKo(p.paidOn)}` : `입금 예정일 ${formatDateKo(p.dueDate)}`}</p></div>
                      <StatusBadge tone={st === "paid" ? "green" : st === "overdue" ? "red" : "yellow"}>{st === "paid" ? "입금확인" : st === "overdue" ? "미수" : "입금 예정"}</StatusBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section aria-label="활동" className="rounded-xl border border-[#E3E8E4] bg-white p-4 md:p-5">
            <h2 className="mb-3 text-sm font-bold">활동</h2>
            {acts.length === 0 ? <p className="text-sm text-[#5F6B64]">아직 금액 관련 활동이 없어요.</p> : (
              <ul className="space-y-2 text-sm">{acts.map(a => <li key={a.id}><p>{a.message}</p><p className="text-xs text-[#7A867F]">{formatDateTimeKo(a.createdAt)}</p></li>)}</ul>
            )}
          </section>
        </div>
      </div>
      <ContractForm open={editing} contract={c} onOpenChange={setEditing} onSaved={() => setEditing(false)} />
    </>
  );
}
