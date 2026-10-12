import { Suspense } from "react";
import type { Metadata } from "next";
import { StatsWorkspace } from "@/components/admin/stats/StatsWorkspace";

export const metadata: Metadata = { title: "방문 통계" };

export default function Page() {
  return <Suspense><StatsWorkspace /></Suspense>;
}
