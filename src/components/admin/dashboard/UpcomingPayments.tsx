import Link from "next/link";
import { Wallet } from "lucide-react";
import type { Customer, ISODate, Payment } from "@/domain/types";
import { PAYMENT_KIND_LABEL } from "@/domain/defaults";
import { formatDateKo, formatWon } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";

/** 이번 주 입금 예정 + 이미 지난 미수. */
export function UpcomingPayments({ payments, customers, today, weekEnd }: { payments: Payment[]; customers: Customer[]; today: ISODate; weekEnd: ISODate }) {
  const list = payments.filter(p => !p.paidOn && p.dueDate <= weekEnd).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
  const name = (id: string) => customers.find(c => c.id === id)?.name ?? "고객";
  return (
    <section aria-labelledby="upcoming-pay" className="rounded-xl border border-[#E3E8E4] bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="upcoming-pay" className="text-sm font-bold text-[#1F2A24]">입금 예정·미수</h2>
        <Link href="/admin/payments" className="inline-flex min-h-11 items-center text-xs text-[#2F8F57] md:min-h-8">전체 보기</Link>
      </div>
      {list.length === 0 ? (
        <p className="flex items-center gap-1.5 py-3 text-sm text-[#7A867F]"><Wallet className="size-4" aria-hidden />이번 주 입금 예정이 없어요</p>
      ) : (
        <ul className="divide-y divide-[#EEF1EF]">
          {list.map(p => (
            <li key={p.id}>
              <Link href={`/admin/payments?id=${p.id}`} className="flex min-h-11 items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#1F2A24]">{name(p.customerId)} · {PAYMENT_KIND_LABEL[p.kind]}</span>
                  <span className="block text-xs text-[#7A867F]">{formatDateKo(p.dueDate)}</span>
                </span>
                {p.dueDate < today ? <StatusBadge tone="red">미수</StatusBadge> : <StatusBadge tone="blue">예정</StatusBadge>}
                <span className="shrink-0 text-sm font-bold text-[#1F2A24]">{formatWon(p.amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
