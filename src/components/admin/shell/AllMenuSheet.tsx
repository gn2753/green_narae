"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, X } from "lucide-react";
import type { Admin } from "@/domain/types";
import { isMenuActive } from "@/domain/adminNav";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { cn } from "@/lib/utils";
import { ADMIN_MENU, INQUIRY_MENU_ID } from "./adminMenu";
import { CountBadge } from "./CountBadge";
import { useLogout, useOpenInquiryCount } from "./useShellData";

export interface AllMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin;
}

/** 모바일(<768px) 전체 메뉴: 그룹별 아이콘 격자 + 로그인 사용자·홈페이지 보기·로그아웃. */
export function AllMenuSheet({ open, onOpenChange, admin }: AllMenuSheetProps) {
  const pathname = usePathname();
  const openCount = useOpenInquiryCount();
  const logout = useLogout();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 rounded-t-2xl bg-admin-bg p-0">
          <SheetClose aria-label="닫기" className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg text-[#56645C] hover:bg-black/5"><X className="size-5" aria-hidden /></SheetClose>
        <div className="shrink-0 px-4 pt-4 pb-2 pr-14">
          <SheetTitle className="text-lg font-bold text-[#1F2A24]">전체 메뉴</SheetTitle>
          <SheetDescription className="sr-only">관리자 메뉴 전체 목록</SheetDescription>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-3" aria-label="전체 메뉴">
          {ADMIN_MENU.map(g => (
            <section key={g.group} className="mt-3 first:mt-1">
              <h3 className="mb-1.5 text-xs font-bold text-[#7A867F]">{g.group === "추가" ? "추가 기능" : g.group}</h3>
              <ul className="grid grid-cols-4 gap-1.5">
                {g.items.map(item => {
                  const active = isMenuActive(pathname, item.href, item.also);
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border bg-white px-1 py-2 text-center text-[11px] leading-tight",
                          active ? "border-brand font-bold text-brand" : "border-[#E3E8E4] text-[#1F2A24]",
                        )}
                      >
                        <Icon className={cn("size-5", active ? "text-brand" : "text-[#56645C]")} aria-hidden />
                        <span className="break-keep">{item.label}</span>
                        {item.id === INQUIRY_MENU_ID && <CountBadge count={openCount} className="absolute top-1 right-1" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
        <div className="shrink-0 border-t bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2.5">
            <AdminAvatar id={admin.id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{admin.name}</p>
              <p className="text-xs text-[#7A867F]">{admin.title}</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/" target="_blank" rel="noopener noreferrer" onClick={close} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] text-sm font-medium">
              <ExternalLink className="size-4" aria-hidden /> 홈페이지 보기 ↗
            </Link>
            <button type="button" onClick={() => { close(); logout(); }} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] text-sm font-medium">
              <LogOut className="size-4" aria-hidden /> 로그아웃
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
