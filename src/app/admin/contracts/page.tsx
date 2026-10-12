import type { Metadata } from "next";
import { Suspense } from "react";
import { ContractList } from "@/components/admin/contracts/ContractList";

export const metadata: Metadata = { title: "견적·계약" };

export default function Page() {
  return <Suspense fallback={null}><ContractList /></Suspense>;
}
