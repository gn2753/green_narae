"use client";
import Link from "next/link";
import { TASK_TABS } from "@/components/admin/shell/adminMenu";
import type { PageHeaderTab } from "@/components/admin/shell/PageHeader";
import { cn } from "@/lib/utils";

export type A02Active = "tasks" | "projects";

/** PageHeader `tabs`에 넘길 A02 탭 목록(파트별 업무 ↔ 의뢰 진행). */
export function a02TabItems(active: A02Active): PageHeaderTab[] {
  return TASK_TABS.map(t => ({ ...t, active: t.href === (active === "tasks" ? "/admin/tasks" : "/admin/projects") }));
}

/** PageHeader 밖에서 쓰는 A02 탭(같은 모양). PageHeader 안에서는 `tabs={a02TabItems(active)}`를 쓴다. */
export function A02Tabs({ active, className }: { active: A02Active; className?: string }) {
  return (
    <nav className={cn("-mb-px flex gap-1 overflow-x-auto border-b border-[#E3E8E4]", className)} aria-label="화면 탭">
      {a02TabItems(active).map(t => (
        <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined}
          className={cn("inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm whitespace-nowrap", t.active ? "border-brand font-bold text-brand" : "border-transparent text-[#5F6B64] hover:text-[#1F2A24]")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
