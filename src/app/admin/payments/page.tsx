import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentList } from "@/components/admin/payments/PaymentList";

export const metadata: Metadata = { title: "계약금·잔금" };

export default function Page() {
  return <Suspense fallback={null}><PaymentList /></Suspense>;
}
