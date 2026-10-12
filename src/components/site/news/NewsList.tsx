"use client";
import { useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import { useCollection } from "@/data/hooks";
import { NEWS_CATEGORY_LABEL } from "@/domain/defaults";
import type { NewsCategory } from "@/domain/types";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../SectionTitle";
import { NewsCard } from "./NewsCard";

const TABS: { key: NewsCategory | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  ...(Object.keys(NEWS_CATEGORY_LABEL) as NewsCategory[]).map((k) => ({ key: k, label: NEWS_CATEGORY_LABEL[k] })),
];

export function NewsList() {
  const { items, loading } = useCollection("news");
  const [tab, setTab] = useState<NewsCategory | "all">("all");
  const list = useMemo(
    () => items
      .filter((n) => n.published && (tab === "all" || n.category === tab))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedOn.localeCompare(a.publishedOn)),
    [items, tab],
  );
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <SectionTitle eyebrow="NEWS" title="소식·공지" lead="그린나래디자인의 새 소식과 공지를 알려드려요." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="분류">
        {TABS.map((t) => (
          <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("min-h-11 rounded-full border-2 border-ink px-4 text-[13px] transition-colors", tab === t.key ? "bg-ink text-white" : "bg-white hover:bg-brand-light")}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="ink-card h-56 animate-pulse bg-white/60" />)}</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-sm text-[#56645C]"><Newspaper className="size-8" aria-hidden />아직 등록된 글이 없어요.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((n) => <NewsCard key={n.id} item={n} />)}</div>
      )}
    </section>
  );
}
