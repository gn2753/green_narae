import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersWorkspace } from "@/components/admin/orders/OrdersWorkspace";

export const metadata: Metadata = { title: "제작업체·발주" };

export default function Page() {
  return <Suspense fallback={null}><OrdersWorkspace /></Suspense>;
}
