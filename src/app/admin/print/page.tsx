import type { Metadata } from "next";
import { Suspense } from "react";
import { PrintWorkspace } from "@/components/admin/print/PrintWorkspace";

export const metadata: Metadata = { title: "자료·인쇄" };

export default function Page() {
  return <Suspense fallback={null}><PrintWorkspace /></Suspense>;
}
