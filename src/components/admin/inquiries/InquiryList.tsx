"use client";
import { Globe, Mail, MessageCircle, MessageSquareText, Phone, UserRound, type LucideIcon } from "lucide-react";
import type { Inquiry, InquirySource } from "@/domain/types";
import { INQUIRY_STATUS_LABEL, SOURCE_LABEL } from "@/domain/defaults";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTimeKo, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

export const SOURCE_ICON: Record<InquirySource, LucideIcon> = { web: Globe, phone: Phone, kakao: MessageCircle, visit: UserRound, email: Mail, etc: MessageSquareText };

/** 문의 목록(접수 최신순). 행을 누르면 `onSelect`. */
export function InquiryList({ items, selectedId, onSelect }: { items: Inquiry[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul className="divide-y divide-[#EEF1EF] overflow-hidden rounded-xl border border-[#E3E8E4] bg-white">
      {items.map(q => {
        const Icon = SOURCE_ICON[q.source];
        const selected = q.id === selectedId;
        return (
          <li key={q.id}>
            <button type="button" onClick={() => onSelect(q.id)} aria-current={selected ? "true" : undefined}
              className={cn("block min-h-[76px] w-full px-4 py-3 text-left outline-none hover:bg-[#F6F7F5] focus-visible:bg-[#F6F7F5]", selected && "bg-[#EAF4EE] hover:bg-[#EAF4EE]")}>
              <span className="flex items-center gap-2">
                {q.isNew && <span className="rounded bg-[#D64545] px-1.5 py-0.5 text-[10px] leading-none font-black text-white">NEW</span>}
                <span className="truncate font-bold">{q.name}</span>
                <span className="shrink-0 text-xs text-[#7A867F]">{formatPhone(q.phone)}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-[#7A867F]"><Icon className="size-3.5" aria-label={SOURCE_LABEL[q.source]} role="img" />{formatDateTimeKo(q.createdAt)}</span>
              </span>
              <span className="mt-1 block truncate text-sm text-[#56645C]">{q.message}</span>
              <span className="mt-1.5 flex items-center gap-2 text-xs text-[#7A867F]">
                <StatusBadge tone={q.status === "open" ? "red" : q.status === "answered" ? "green" : "gray"}>{INQUIRY_STATUS_LABEL[q.status]}</StatusBadge>
                {q.assigneeId ? <AdminAvatar id={q.assigneeId} size="xs" withName /> : <span>담당 미지정</span>}
                <span className="ml-auto">답변 {q.replies.length}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
