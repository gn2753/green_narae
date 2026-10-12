import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PortfolioPageView } from "@/components/site/portfolio/PortfolioPageView";

export const metadata: Metadata = { title: "포트폴리오", description: "그린나래디자인이 시공한 간판 사례를 종류별로 확인하세요." };

export default function PortfolioPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <PortfolioPageView />
      </Suspense>
    </SiteShell>
  );
}
