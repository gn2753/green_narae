"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { UsersPermissions } from "./UsersPermissions";
import { CategorySettings } from "./CategorySettings";
import { BackupPanel } from "./BackupPanel";
import { ArchiveList } from "./ArchiveList";

const TABS = [
  { id: "users", label: "사용자·권한" }, { id: "categories", label: "분류 설정" }, { id: "backup", label: "백업" }, { id: "archive", label: "보관함" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** A12 설정. `?tab=users|categories|backup|archive` */
export function SettingsWorkspace() {
  const pathname = usePathname();
  const q = useSearchParams().get("tab");
  const tab: TabId = TABS.find(t => t.id === q)?.id ?? "users";
  return (
    <>
      <PageHeader title="사용자·권한" description="누가 쓸 수 있는지, 분류 이름, 백업과 보관함을 관리해요."
        tabs={TABS.map(t => ({ label: t.label, href: t.id === "users" ? pathname : `${pathname}?tab=${t.id}`, active: tab === t.id }))} />
      {tab === "users" && <UsersPermissions />}
      {tab === "categories" && <CategorySettings />}
      {tab === "backup" && <BackupPanel />}
      {tab === "archive" && <ArchiveList />}
    </>
  );
}
