"use client";
import { useSearchParams } from "next/navigation";
import { NewsDetail } from "./NewsDetail";
import { NewsList } from "./NewsList";

export function NewsPageView() {
  const id = useSearchParams().get("id");
  return id ? <NewsDetail id={id} /> : <NewsList />;
}
