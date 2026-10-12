"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { normalizePath } from "@/domain/adminNav";
import { cn } from "@/lib/utils";

export interface PageHeaderTab {
  label: string;
  href: string;
  /** 활성 여부를 직접 정할 때(쿼리로 탭을 나누는 경우). 생략하면 경로가 같을 때 활성. */
  active?: boolean;
}

export interface PageHeaderProps {
  /** 화면 제목 */
  title: ReactNode;
  /** 제목 아래 한 줄 설명 */
  description?: ReactNode;
  /** 오른쪽 주요 버튼들(모바일에서는 제목 아래로 내려가 줄바꿈) */
  actions?: ReactNode;
  /** 제목 아래 이동 탭(예: 파트별 업무 / 의뢰 진행) */
  tabs?: PageHeaderTab[];
  /** 상세 화면에서 목록으로 돌아가는 링크(예: `{ href: "/admin/customers", label: "고객 목록" }`) */
  back?: { href: string; label?: string };
  className?: string;
}

/** 관리자 화면 상단: (뒤로) · 제목 · 설명 · 주요 버튼 · 탭. */
export function PageHeader({ title, description, actions, tabs, back, className }: PageHeaderProps) {
  const pathname = normalizePath(usePathname());
  return (
    <header className={cn("mb-4 md:mb-6", className)}>
      {back && (
        <Link href={back.href} className="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-sm text-[#56645C] hover:text-[#1F2A24] md:h-9">
          <ChevronLeft className="size-4" aria-hidden />
          {back.label ?? "목록"}
        </Link>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-[#1F2A24] md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#5F6B64]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-11 md:[&_button]:min-h-10">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <nav className="mt-4 -mb-px flex gap-1 overflow-x-auto border-b border-[#E3E8E4]" aria-label="화면 탭">
          {tabs.map(t => {
            const active = t.active ?? normalizePath(t.href) === pathname;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm whitespace-nowrap",
                  active ? "border-brand font-bold text-brand" : "border-transparent text-[#5F6B64] hover:text-[#1F2A24]",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
