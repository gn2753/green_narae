"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCollection } from "@/data/hooks";
import { NEWS_CATEGORY_LABEL } from "@/domain/defaults";
import { asset } from "@/lib/asset";
import type { News } from "@/domain/types";

export function NewsDetail({ id }: { id: string }) {
  const { items, loading } = useCollection("news");
  const list = useMemo(
    () => items.filter((n) => n.published).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedOn.localeCompare(a.publishedOn)),
    [items],
  );
  const idx = list.findIndex((n) => n.id === id);
  const item = idx >= 0 ? list[idx] : null;

  if (loading) {
    return <section className="mx-auto max-w-3xl px-4 py-10 md:px-8"><div className="ink-card h-80 animate-pulse bg-white/60" /></section>;
  }
  if (!item) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-jua text-2xl">글을 찾을 수 없어요</h1>
        <p className="text-sm text-[#56645C]">삭제되었거나 주소가 잘못되었을 수 있어요.</p>
        <Link href="/news" className="ink-btn flex min-h-11 items-center bg-brand px-6 text-white">목록으로</Link>
      </section>
    );
  }
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-12">
      <NewsArticleBody item={item} />
      <nav aria-label="이전·다음 글" className="mt-10 grid gap-2 border-t-2 border-ink pt-5 sm:grid-cols-2">
        {prev ? (
          <Link href={`/news?id=${prev.id}`} className="ink-card flex min-h-11 items-center gap-2 p-3 text-sm"><ChevronLeft className="size-4 shrink-0" aria-hidden /><span className="min-w-0"><span className="block text-[11px] text-[#56645C]">이전 글</span><span className="block truncate">{prev.title}</span></span></Link>
        ) : <span />}
        {next ? (
          <Link href={`/news?id=${next.id}`} className="ink-card flex min-h-11 items-center justify-end gap-2 p-3 text-right text-sm"><span className="min-w-0"><span className="block text-[11px] text-[#56645C]">다음 글</span><span className="block truncate">{next.title}</span></span><ChevronRight className="size-4 shrink-0" aria-hidden /></Link>
        ) : <span />}
      </nav>
      <div className="mt-6 text-center">
        <Link href="/news" className="ink-btn inline-flex min-h-11 items-center bg-white px-6 text-sm">목록으로</Link>
      </div>
    </article>
  );
}

/** 글 머리(분류·날짜·제목·대표 이미지)와 본문. 관리자 미리보기에서도 그대로 쓴다. */
export function NewsArticleBody({ item }: { item: Pick<News, "category" | "publishedOn" | "title" | "cover" | "body"> }) {
  const paragraphs = item.body.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="rounded-full border-[1.5px] border-ink bg-sun px-2 py-px font-medium">{NEWS_CATEGORY_LABEL[item.category]}</span>
        <span className="text-[#56645C]">{item.publishedOn.replaceAll("-", ".")}</span>
      </div>
      <h1 className="mb-5 font-jua text-2xl leading-snug md:text-3xl">{item.title}</h1>
      {item.cover && (
        <div className="ink-card mb-5 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(item.cover.url)} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}
      <div className="space-y-4 text-[15px] leading-loose">
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </>
  );
}
