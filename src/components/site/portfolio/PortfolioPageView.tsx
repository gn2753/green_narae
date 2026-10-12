"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/data/hooks";
import { SectionTitle } from "../SectionTitle";
import { PortfolioGrid } from "./PortfolioGrid";

export function PortfolioPageView() {
  const type = useSearchParams().get("type");
  const { items, loading } = useCollection("portfolios");
  const list = useMemo(() => items.filter((p) => p.published).sort((a, b) => a.order - b.order), [items]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <SectionTitle eyebrow="PORTFOLIO" title="포트폴리오" lead="그린나래디자인이 만든 간판들이에요. 카드를 누르면 큰 사진과 작업 설명이 열립니다." />
      <PortfolioGrid key={type ?? ""} items={list} columns="page" loading={loading} initialType={type} />
    </section>
  );
}
