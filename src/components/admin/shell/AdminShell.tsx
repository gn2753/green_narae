"use client";
import type { ReactNode } from "react";
import type { Admin } from "@/domain/types";
import { DemoBanner } from "@/components/common/DemoBanner";
import { Sidebar } from "./Sidebar";
import { BottomTabs } from "./BottomTabs";
import { QuickAddButton } from "./QuickAddButton";

/**
 * 관리자 화면 틀: 데모 띠(상단 고정) + 사이드바(≥768px) + 본문(`bg-admin-bg`) + 하단 탭·＋버튼(<768px).
 * 본문 여백은 여기서 주므로 각 페이지는 `<PageHeader />`부터 바로 그린다.
 */
export function AdminShell({ admin, children }: { admin: Admin; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-admin-bg text-[#1F2A24]">
      <div className="sticky top-0 z-40">
        <DemoBanner variant="admin" />
      </div>
      <div className="flex">
        <Sidebar admin={admin} />
        <main
          id="admin-main"
          className="min-w-0 flex-1 px-4 pt-4 pb-[calc(var(--mobile-bar-h)+env(safe-area-inset-bottom)+88px)] md:px-6 md:pt-6 md:pb-10 xl:px-8"
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
      <BottomTabs admin={admin} />
      <QuickAddButton />
    </div>
  );
}
