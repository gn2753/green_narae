import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsPageView } from "@/components/site/news/NewsPageView";

export const metadata: Metadata = { title: "소식·공지", description: "그린나래디자인의 새 소식과 공지, 이벤트를 알려드립니다." };

export default function NewsPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <NewsPageView />
      </Suspense>
    </SiteShell>
  );
}
