import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectBoard } from "@/components/admin/projects/ProjectBoard";

export const metadata: Metadata = { title: "의뢰 진행" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProjectBoard />
    </Suspense>
  );
}
