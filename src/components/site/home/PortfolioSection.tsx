"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useCollection } from "@/data/hooks";
import { PortfolioGrid } from "../portfolio/PortfolioGrid";
import { SectionTitle } from "../SectionTitle";

export function PortfolioSection() {
  const { items, loading } = useCollection("portfolios");
  const list = useMemo(() => items.filter((p) => p.published).sort((a, b) => a.order - b.order), [items]);
  return (
    <section id="portfolio" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-10 md:px-8 md:py-12">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle eyebrow="PORTFOLIO" title="대표 시공사례" lead="카드를 누르면 큰 사진과 작업 설명이 열립니다." />
        <Link href="/portfolio" className="mb-5 flex min-h-11 shrink-0 items-center text-sm font-bold text-brand">전체 보기 →</Link>
      </div>
      <PortfolioGrid items={list} limit={10} columns="home" loading={loading} />
    </section>
  );
}
