import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerList } from "@/components/admin/customers/CustomerList";

export const metadata: Metadata = { title: "고객리스트" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomerList />
    </Suspense>
  );
}
