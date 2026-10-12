import { SiteShell } from "@/components/site/SiteShell";
import { Hero } from "@/components/site/home/Hero";
import { Strengths } from "@/components/site/home/Strengths";
import { PortfolioSection } from "@/components/site/home/PortfolioSection";
import { ProcessSteps } from "@/components/site/home/ProcessSteps";
import { NewsTeaser } from "@/components/site/home/NewsTeaser";
import { ContactSection } from "@/components/site/home/ContactSection";
import { LocationSection } from "@/components/site/home/LocationSection";
import { LocalBusinessJsonLd } from "@/components/site/LocalBusinessJsonLd";

export default function Home() {
  return (
    <SiteShell>
      <LocalBusinessJsonLd />
      <Hero />
      <Strengths />
      <PortfolioSection />
      <ProcessSteps />
      <NewsTeaser />
      <ContactSection />
      <LocationSection />
    </SiteShell>
  );
}
