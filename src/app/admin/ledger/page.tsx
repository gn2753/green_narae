import type { Metadata } from "next";
import { Suspense } from "react";
import { LedgerWorkspace } from "@/components/admin/ledger/LedgerWorkspace";

export const metadata: Metadata = { title: "매입·매출" };

export default function Page() {
  return <Suspense fallback={null}><LedgerWorkspace /></Suspense>;
}
