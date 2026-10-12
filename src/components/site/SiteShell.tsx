import { DemoBanner } from "@/components/common/DemoBanner";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { FloatingContact } from "./FloatingContact";
import { PageViewTracker } from "./PageViewTracker";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream pb-[var(--mobile-bar-h)] text-ink md:pb-0">
      <DemoBanner variant="site" />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingContact />
      <PageViewTracker />
    </div>
  );
}
