import Link from "next/link";
import { Inbox } from "lucide-react";
import type { Inquiry } from "@/domain/types";
import { SOURCE_LABEL } from "@/domain/defaults";
import { formatDateKo } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";

export function RecentInquiries({ inquiries }: { inquiries: Inquiry[] }) {
  const recent = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  return (
    <section aria-labelledby="recent-inq" className="rounded-xl border border-[#E3E8E4] bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="recent-inq" className="text-sm font-bold text-[#1F2A24]">최근 문의</h2>
        <Link href="/admin/inquiries" className="inline-flex min-h-11 items-center text-xs text-[#2F8F57] md:min-h-8">전체 보기</Link>
      </div>
      {recent.length === 0 ? (
        <p className="flex items-center gap-1.5 py-3 text-sm text-[#7A867F]"><Inbox className="size-4" aria-hidden />아직 들어온 문의가 없어요</p>
      ) : (
        <ul className="divide-y divide-[#EEF1EF]">
          {recent.map(q => (
            <li key={q.id}>
              <Link href={`/admin/inquiries?id=${q.id}`} className="block min-h-11 py-2">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-[#1F2A24]">{q.name}</span>
                  {q.isNew && <StatusBadge tone="red">NEW</StatusBadge>}
                  {q.status === "open" && !q.isNew && <StatusBadge tone="yellow">미답변</StatusBadge>}
                  <span className="ml-auto shrink-0 text-xs text-[#7A867F]">{SOURCE_LABEL[q.source]} · {formatDateKo(q.createdAt.slice(0, 10))}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#5F6B64]">{q.message}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
