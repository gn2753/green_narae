import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskBoard } from "@/components/admin/tasks/TaskBoard";

export const metadata: Metadata = { title: "업무·일정" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TaskBoard />
    </Suspense>
  );
}
