"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NAV_ITEMS } from "./siteInfo";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 md:px-8">
        <Logo />
        <nav className="hidden gap-6 text-sm font-medium md:flex" aria-label="주 메뉴">
          {NAV_ITEMS.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-11 items-center border-b-[3px] border-transparent", active && "border-brand font-black")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2.5 text-xs md:flex">
          <Link href="/member" className="flex min-h-11 items-center px-1">로그인</Link>
          <Link href="/member" className="flex min-h-11 items-center">
            <span className="rounded-full border-2 border-ink bg-white px-3 py-1.5">회원가입</span>
          </Link>
          <Link href="/admin/login" className="flex min-h-11 items-center">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-white">
              <Lock className="size-3" /> 관리자
            </span>
          </Link>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
