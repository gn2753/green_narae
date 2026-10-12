"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, ClipboardList, House, LayoutGrid, MessageSquare, type LucideIcon } from "lucide-react";
import type { Admin } from "@/domain/types";
import { isMenuActive } from "@/domain/adminNav";
import { cn } from "@/lib/utils";
import { AllMenuSheet } from "./AllMenuSheet";
import { CountBadge } from "./CountBadge";
import { useOpenInquiryCount } from "./useShellData";

const TABS: { label: string; href: string; icon: LucideIcon; also?: string[]; badge?: boolean }[] = [
  { label: "홈", href: "/admin", icon: House },
  { label: "업무", href: "/admin/tasks", icon: ClipboardList, also: ["/admin/projects"] },
  { label: "문의", href: "/admin/inquiries", icon: MessageSquare, badge: true },
  { label: "달력", href: "/admin/calendar", icon: CalendarDays },
];

const tabCls = "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] outline-none focus-visible:bg-[#EEF6F1]";

/** 모바일(<768px) 하단 탭 5개: 홈 · 업무 · 문의(미답변 배지) · 달력 · 전체메뉴. 높이는 `--mobile-bar-h`. */
export function BottomTabs({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  const openCount = useOpenInquiryCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const inTabs = TABS.some(t => isMenuActive(pathname, t.href, t.also));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E3E8E4] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="관리자 하단 메뉴"
      >
        <ul className="flex h-[var(--mobile-bar-h)]">
          {TABS.map(t => {
            const active = isMenuActive(pathname, t.href, t.also);
            const Icon = t.icon;
            return (
              <li key={t.href} className="flex min-w-0 flex-1">
                <Link href={t.href} aria-current={active ? "page" : undefined} className={cn(tabCls, active ? "font-bold text-brand" : "text-[#7A867F]")}>
                  <span className="relative">
                    <Icon className="size-6" aria-hidden />
                    {t.badge && <CountBadge count={openCount} className="absolute -top-1.5 -right-3" />}
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li className="flex min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              className={cn(tabCls, !inTabs ? "font-bold text-brand" : "text-[#7A867F]")}
            >
              <LayoutGrid className="size-6" aria-hidden />
              전체메뉴
            </button>
          </li>
        </ul>
      </nav>
      <AllMenuSheet open={menuOpen} onOpenChange={setMenuOpen} admin={admin} />
    </>
  );
}
