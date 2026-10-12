"use client";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { adminMenuItem } from "./adminMenu";
import { PageHeader, type PageHeaderTab } from "./PageHeader";

/** 아직 만들지 않은 관리자 화면 자리(메뉴 링크가 깨지지 않도록). */
export function AdminPlaceholder({ menuId, title, tabs }: { menuId: string; title?: string; tabs?: PageHeaderTab[] }) {
  const item = adminMenuItem(menuId);
  return (
    <>
      <PageHeader title={title ?? item?.label ?? "준비 중"} tabs={tabs} />
      <EmptyState icon={item?.icon ?? Construction} title="이 화면은 다음 단계에서 채워집니다" description="메뉴 이동과 화면 틀을 먼저 확인할 수 있도록 자리만 만들어 두었어요." />
    </>
  );
}
