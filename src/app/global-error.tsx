"use client";
import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#F6F7F5" }}>
        <ErrorFallback reset={reset} />
      </body>
    </html>
  );
}
