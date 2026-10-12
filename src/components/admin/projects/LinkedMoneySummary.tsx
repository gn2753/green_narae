"use client";
import Link from "next/link";
import { ArrowRight, Factory, ReceiptText, Wallet } from "lucide-react";
import { useCollection, useToday } from "@/data/hooks";
import { CONTRACT_STATUS_LABEL, ORDER_STATUS_LABEL, PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { activePayments, paymentStatus } from "@/domain/money";
import type { ContractStatus, OrderStatus } from "@/domain/types";
import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import { formatDateKo, formatWon } from "@/lib/format";

const CONTRACT_TONE: Record<ContractStatus, StatusTone> = { draft: "gray", sent: "yellow", signed: "green", cancelled: "red" };
const ORDER_TONE: Record<OrderStatus, StatusTone> = { requested: "gray", producing: "yellow", shipped: "blue", received: "green" };
const linkCls = "inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-bold text-[#1E6E41] hover:bg-[#F6F7F5] md:min-h-9";

function Box({ icon: Icon, title, children, action }: { icon: typeof Wallet; title: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E3E8E4] bg-[#FAFBFA] p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1F2A24]"><Icon className="size-4 text-[#56645C]" aria-hidden />{title}</h4>
      <div className="space-y-2 text-sm">{children}</div>
      <div className="mt-3 flex flex-wrap gap-2">{action}</div>
    </section>
  );
}

/**
 * 의뢰에 연결된 금액 요약(읽기 전용).
 * - contract: A04 견적·계약 / orders: A05 발주 / payments: A07 입금
 */
export function LinkedMoneySummary({ projectId, show }: { projectId: string; show: "contract" | "orders" | "payments" }) {
  const today = useToday();
  const { items: contracts } = useCollection("contracts");
  const { items: orders } = useCollection("orders");
  const { items: vendors } = useCollection("vendors");
  const { items: allPayments } = useCollection("payments");
  const payments = activePayments(allPayments, contracts);

  if (show === "contract") {
    const list = contracts.filter(c => c.projectId === projectId);
    const first = list[0];
    return (
      <Box icon={ReceiptText} title="견적·계약 (A04)" action={
        <Link href={first ? `/admin/contracts?id=${first.id}` : `/admin/contracts?new=1&project=${projectId}`} className={linkCls}>
          {first ? "견적·계약 열기" : "견적 작성하기"}<ArrowRight className="size-4" aria-hidden />
        </Link>
      }>
        {list.length === 0 && <p className="text-[#5F6B64]">아직 연결된 견적·계약이 없어요.</p>}
        {list.map(c => (
          <dl key={c.id} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-white p-2.5 ring-1 ring-[#EEF1EF]">
            <dt className="text-[#5F6B64]">상태</dt><dd><StatusBadge tone={CONTRACT_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</StatusBadge></dd>
            <dt className="text-[#5F6B64]">견적 금액</dt><dd className="font-bold">{formatWon(c.quoteAmount)} <span className="font-normal text-[#7A867F]">{c.vatIncluded ? "(부가세 포함)" : "(부가세 별도)"}</span></dd>
            {c.contractAmount !== undefined && <><dt className="text-[#5F6B64]">계약 금액</dt><dd className="font-bold">{formatWon(c.contractAmount)}</dd></>}
            {c.deposit && <><dt className="text-[#5F6B64]">계약금</dt><dd>{formatWon(c.deposit.amount)} · {formatDateKo(c.deposit.dueDate)}</dd></>}
            {c.balance && <><dt className="text-[#5F6B64]">잔금</dt><dd>{formatWon(c.balance.amount)} · {formatDateKo(c.balance.dueDate)}</dd></>}
          </dl>
        ))}
      </Box>
    );
  }

  if (show === "orders") {
    const list = orders.filter(o => o.projectId === projectId);
    const vendorName = (id: string) => vendors.find(v => v.id === id)?.name ?? "제작업체";
    return (
      <Box icon={Factory} title="발주 (A05)" action={<>
        <Link href={`/admin/orders?new=1&project=${projectId}`} className={linkCls}>발주 등록<ArrowRight className="size-4" aria-hidden /></Link>
        {list.length > 0 && <Link href="/admin/orders" className={linkCls}>발주 목록</Link>}
      </>}>
        {list.length === 0 && <p className="text-[#5F6B64]">아직 발주가 없어요.</p>}
        {list.map(o => (
          <div key={o.id} className="flex items-start justify-between gap-2 rounded-lg bg-white p-2.5 ring-1 ring-[#EEF1EF]">
            <div className="min-w-0">
              <p className="font-bold break-words">{o.item}</p>
              <p className="text-xs text-[#5F6B64]">{vendorName(o.vendorId)} · 납기 {formatDateKo(o.dueDate)}</p>
            </div>
            <div className="shrink-0 text-right">
              <StatusBadge tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</StatusBadge>
              <p className="mt-1 text-xs font-bold">{formatWon(o.amount)}</p>
            </div>
          </div>
        ))}
      </Box>
    );
  }

  const list = payments.filter(p => p.projectId === projectId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const total = list.reduce((s, p) => s + p.amount, 0);
  const paid = list.filter(p => p.paidOn).reduce((s, p) => s + p.amount, 0);
  const nextUnpaid = list.find(p => !p.paidOn);
  return (
    <Box icon={Wallet} title="입금 (A07)" action={
      <Link href={nextUnpaid ? `/admin/payments?id=${nextUnpaid.id}` : "/admin/payments"} className={linkCls}>입금 관리 열기<ArrowRight className="size-4" aria-hidden /></Link>
    }>
      {list.length === 0 ? <p className="text-[#5F6B64]">입금 예정 항목이 없어요. 계약을 완료하면 계약금·잔금이 생겨요.</p> : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2"><span className="text-[#5F6B64]">입금</span><b>{formatWon(paid)}</b><span className="text-[#7A867F]">/ 전체 {formatWon(total)}</span>
            {paid >= total && <StatusBadge tone="green" dot>정산 완료</StatusBadge>}</p>
          <ul className="space-y-1.5">
            {list.map(p => {
              const st = paymentStatus(p, today);
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#EEF1EF]">
                  <span className="min-w-0"><b>{PAYMENT_KIND_LABEL[p.kind]}</b> <span className="text-xs text-[#5F6B64]">{p.paidOn ? `${formatDateKo(p.paidOn)} 입금` : `${formatDateKo(p.dueDate)} 예정`}</span></span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-bold">{formatWon(p.amount)}</span>
                    <StatusBadge tone={st === "paid" ? "green" : st === "overdue" ? "red" : "gray"}>{st === "paid" ? "입금확인" : st === "overdue" ? "미수" : "예정"}</StatusBadge>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Box>
  );
}
