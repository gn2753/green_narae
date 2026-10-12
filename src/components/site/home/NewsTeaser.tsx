"use client";
import Link from "next/link";
import { useCollection } from "@/data/hooks";
import { NewsCard } from "../news/NewsCard";
import { SectionTitle } from "../SectionTitle";

export function NewsTeaser() {
  const { items, loading } = useCollection("news");
  const list = items
    .filter((n) => n.published)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedOn.localeCompare(a.publishedOn))
    .slice(0, 3);
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle eyebrow="NEWS" title="소식·공지" />
        <Link href="/news" className="mb-5 flex min-h-11 items-center text-sm font-bold text-brand">더보기 →</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="ink-card h-56 animate-pulse bg-white/60" />)
          : list.map((n) => <NewsCard key={n.id} item={n} />)}
      </div>
    </section>
  );
}
