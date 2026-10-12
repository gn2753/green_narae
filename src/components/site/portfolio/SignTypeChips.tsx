"use client";
import { cn } from "@/lib/utils";

/** value === null 이면 "전체" */
export function SignTypeChips({ types, value, onChange }: { types: string[]; value: string | null; onChange: (v: string | null) => void }) {
  const all: (string | null)[] = [null, ...types];
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="간판 종류 필터">
      {all.map((t) => {
        const on = t === value;
        return (
          <button
            key={t ?? "__all"}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t)}
            className={cn("min-h-11 rounded-full border-2 border-ink px-4 text-[13px] transition-colors", on ? "bg-ink text-white" : "bg-white hover:bg-brand-light")}
          >
            {t ?? "전체"}
          </button>
        );
      })}
    </div>
  );
}
