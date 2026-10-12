import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/dashboard/Dashboard";

export const metadata: Metadata = { title: "대시보드" };

export default function Page() {
  return <Dashboard />;
}
