"use client";
import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback reset={reset} />;
}
