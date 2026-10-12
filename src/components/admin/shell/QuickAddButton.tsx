"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ListPlus, MessageSquarePlus, Plus, UserPlus, X, type LucideIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const ACTIONS: { label: string; desc: string; href: string; icon: LucideIcon }[] = [
  { label: "업무 등록", desc: "할 일·일정을 바로 추가", href: "/admin/tasks?new=1", icon: ListPlus },
  { label: "문의 등록", desc: "전화·문자로 받은 문의 기록", href: "/admin/inquiries?new=1", icon: MessageSquarePlus },
  { label: "고객 등록", desc: "새 고객 정보 추가", href: "/admin/customers?new=1", icon: UserPlus },
];

/** 모바일(<768px) 우하단 ＋ 버튼 → 빠른 등록 시트(업무 / 문의 / 고객, 각 페이지의 `?new=1`로 이동). */
export function QuickAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="빠른 등록"
        aria-haspopup="dialog"
        className="fixed right-4 bottom-[calc(var(--mobile-bar-h)+env(safe-area-inset-bottom)+16px)] z-30 inline-flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_rgba(31,42,36,0.28)] outline-none active:scale-95 focus-visible:ring-4 focus-visible:ring-brand/30 md:hidden"
      >
        <Plus className="size-7" aria-hidden />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 rounded-t-2xl p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <SheetClose aria-label="닫기" className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg text-[#56645C] hover:bg-black/5"><X className="size-5" aria-hidden /></SheetClose>
          <div className="px-4 pt-4 pb-2 pr-14">
            <SheetTitle className="text-lg font-bold">빠른 등록</SheetTitle>
            <SheetDescription>무엇을 등록할까요?</SheetDescription>
          </div>
          <ul className="flex flex-col px-2 pb-2">
            {ACTIONS.map(a => {
              const Icon = a.icon;
              return (
                <li key={a.href}>
                  <Link href={a.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#F6F7F5] active:bg-[#EEF1EF]">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#E8F3EC] text-brand">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{a.label}</span>
                      <span className="block text-xs text-[#7A867F]">{a.desc}</span>
                    </span>
                    <ChevronRight className="size-4 text-[#9AA59F]" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
