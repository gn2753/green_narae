import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SummaryCard { key: string; label: string; value: string; sub?: string; href: string; tone?: "red" | "coral" }

const TONE = { red: "text-[#C73A3A]", coral: "text-[#D9573F]" } as const;

/** 상단 요약 카드 6개(모바일 2열 / 태블릿 3열 / 데스크톱 6열). 모두 해당 목록으로 이동. */
export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <ul className="mb-4 grid grid-cols-2 gap-2.5 md:mb-6 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
      {cards.map(c => (
        <li key={c.key}>
          <Link href={c.href} className="flex min-h-24 flex-col justify-between rounded-xl border border-[#E3E8E4] bg-white p-3.5 transition-colors hover:border-[#2F8F57] focus-visible:outline-2 focus-visible:outline-[#2F8F57]">
            <span className="text-xs font-medium text-[#5F6B64]">{c.label}</span>
            <span className={cn("mt-1 whitespace-nowrap text-xl font-black 2xl:text-2xl tracking-tight text-[#1F2A24]", c.tone && TONE[c.tone])}>{c.value}</span>
            <span className="min-h-4 text-xs text-[#7A867F]">{c.sub ?? ""}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
