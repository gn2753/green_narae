import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsWorkspace } from "@/components/admin/settings/SettingsWorkspace";

export const metadata: Metadata = { title: "사용자·권한" };

export default function Page() {
  return <Suspense><SettingsWorkspace /></Suspense>;
}
