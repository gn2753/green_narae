import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { ProcessSteps } from "@/components/site/home/ProcessSteps";
import { AboutCta, AboutIntro, Equipment, ServiceAxes, SignTypeList } from "@/components/site/about/AboutSections";

export const metadata: Metadata = { title: "회사·서비스 소개", description: "간판 디자인부터 제작·시공까지 직접 하는 그린나래디자인을 소개합니다." };

export default function AboutPage() {
  return (
    <SiteShell>
      <AboutIntro />
      <ServiceAxes />
      <SignTypeList />
      <ProcessSteps />
      <Equipment />
      <AboutCta />
    </SiteShell>
  );
}
