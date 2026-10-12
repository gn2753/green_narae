"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./siteInfo";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const row = "flex min-h-12 items-center text-lg";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="메뉴 열기"
        className="ink-btn inline-flex size-11 items-center justify-center bg-white md:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="bg-cream p-0">
        <SheetTitle className="px-5 pt-5 font-jua text-xl text-brand">메뉴</SheetTitle>
        <nav className="flex flex-col px-5 pb-6" aria-label="모바일 메뉴">
          {NAV_ITEMS.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} onClick={close} className={cn(row, active ? "font-black text-brand" : "font-medium")}>
                {n.label}
              </Link>
            );
          })}
          <hr className="my-3 border-t-2 border-ink" />
          <Link href="/member" onClick={close} className={row}>로그인</Link>
          <Link href="/member" onClick={close} className={row}>회원가입</Link>
          <Link href="/admin/login" onClick={close} className={cn(row, "gap-1.5")}>
            <Lock className="size-4" /> 관리자
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
