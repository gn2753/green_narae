"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import type { Admin } from "@/domain/types";
import { isMenuActive } from "@/domain/adminNav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { cn } from "@/lib/utils";
import { ADMIN_MENU, INQUIRY_MENU_ID } from "./adminMenu";
import { CountBadge } from "./CountBadge";
import { useLogout, useOpenInquiryCount } from "./useShellData";

/** 아이콘 바(768–1279px)에서만 보이는 오른쪽 툴팁 */
function RailTip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8} className="xl:hidden">{label}</TooltipContent>
    </Tooltip>
  );
}

const itemCls = "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#7FD6A0] max-xl:justify-center max-xl:px-0";

/**
 * 관리자 왼쪽 사이드바. ≥1280px 펼침(240px), 768–1279px 아이콘 바(72px, 툴팁), <768px 숨김(하단 탭 사용).
 */
export function Sidebar({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  const openCount = useOpenInquiryCount();
  const logout = useLogout();

  return (
    <TooltipProvider delay={150}>
      <aside
        className="sticky top-8 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col bg-admin-side text-[#C9D3CC] md:flex md:w-[72px] xl:w-60"
        aria-label="관리자 메뉴"
      >
        <Link href="/admin" className="flex h-16 shrink-0 items-center gap-2 px-5 font-jua text-xl text-[#7FD6A0] max-xl:justify-center max-xl:px-0">
          <span aria-hidden>🍃</span>
          <span className="max-xl:sr-only">그린나래 업무</span>
        </Link>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 [scrollbar-color:#34443A_transparent] [scrollbar-width:thin] xl:px-3">
          {ADMIN_MENU.map((g, gi) => (
            <div key={g.group} className={cn(gi > 0 && "mt-3 border-t border-[#34443A] pt-3")}>
              <p className="mb-1 px-3 text-[11px] font-medium tracking-wide text-[#7A8A80] max-xl:sr-only">
                {g.group === "추가" ? "추가 기능" : g.group}
              </p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map(item => {
                  const active = isMenuActive(pathname, item.href, item.also);
                  const badge = item.id === INQUIRY_MENU_ID ? openCount : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <RailTip label={badge ? `${item.label} (미답변 ${badge})` : item.label}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(itemCls, active ? "bg-brand font-bold text-white" : "hover:bg-[#2A3830] hover:text-white")}
                        >
                          <Icon className="size-5 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1 truncate max-xl:sr-only">{item.label}</span>
                          <CountBadge count={badge} className="max-xl:absolute max-xl:top-0.5 max-xl:right-1.5 max-xl:h-4 max-xl:min-w-4 max-xl:px-1 max-xl:text-[10px]" />
                        </Link>
                      </RailTip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#34443A] p-2.5 xl:p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#2A3830] p-2.5 max-xl:justify-center max-xl:bg-transparent max-xl:p-1">
            <AdminAvatar id={admin.id} size="md" />
            <div className="min-w-0 max-xl:sr-only">
              <p className="truncate text-sm font-bold text-white">{admin.name}</p>
              <p className="text-xs text-[#9AA59F]">{admin.title}</p>
            </div>
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5">
            <RailTip label="홈페이지 보기 ↗">
              <Link href="/" target="_blank" rel="noopener noreferrer" className={cn(itemCls, "text-[13px] hover:bg-[#2A3830] hover:text-white")}>
                <ExternalLink className="size-[18px] shrink-0" aria-hidden />
                <span className="max-xl:sr-only">홈페이지 보기 ↗</span>
              </Link>
            </RailTip>
            <RailTip label="로그아웃">
              <button type="button" onClick={logout} className={cn(itemCls, "w-full text-[13px] hover:bg-[#2A3830] hover:text-white")}>
                <LogOut className="size-[18px] shrink-0" aria-hidden />
                <span className="max-xl:sr-only">로그아웃</span>
              </button>
            </RailTip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

