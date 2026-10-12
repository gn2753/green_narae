import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryWorkspace } from "@/components/admin/inquiries/InquiryWorkspace";

export const metadata: Metadata = { title: "고객 문의·답변" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InquiryWorkspace />
    </Suspense>
  );
}
