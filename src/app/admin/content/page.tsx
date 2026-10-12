import { Suspense } from "react";
import type { Metadata } from "next";
import { ContentWorkspace } from "@/components/admin/content/ContentWorkspace";

export const metadata: Metadata = { title: "홈페이지 콘텐츠" };

export default function Page() {
  return <Suspense><ContentWorkspace /></Suspense>;
}
