import Link from "next/link";
import { Pin } from "lucide-react";
import { NEWS_CATEGORY_LABEL } from "@/domain/defaults";
import type { News } from "@/domain/types";
import { asset } from "@/lib/asset";

export function NewsCard({ item }: { item: News }) {
  return (
    <Link href={`/news?id=${item.id}`} className="ink-card group flex h-full flex-col overflow-hidden transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)]">
      <div className="aspect-[16/9] border-b-2 border-ink bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.cover && <img src={asset(item.cover.url)} alt="" loading="lazy" className="size-full object-cover" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="rounded-full border-[1.5px] border-ink bg-sun px-2 py-px font-medium">{NEWS_CATEGORY_LABEL[item.category]}</span>
          {item.pinned && <Pin className="size-3.5 text-coral" aria-label="상단 고정" />}
          <span className="text-[#56645C]">{item.publishedOn.replaceAll("-", ".")}</span>
        </div>
        <b className="font-jua text-[17px] font-normal leading-snug">{item.title}</b>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-[#56645C]">{item.summary}</p>
      </div>
    </Link>
  );
}
