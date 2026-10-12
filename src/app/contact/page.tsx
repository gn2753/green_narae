import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { SITE_INFO } from "@/components/site/siteInfo";
import { InquiryForm } from "@/components/site/contact/InquiryForm";
import { LocationSection } from "@/components/site/home/LocationSection";

export const metadata: Metadata = { title: "견적·문의", description: "간판 견적과 상담을 문의하세요. 영업일 기준 1일 안에 연락드립니다." };

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-10 md:px-8 md:pt-12">
        <div className="font-jua text-sm text-coral">CONTACT</div>
        <h1 className="mb-1 font-jua text-3xl text-ink">견적·문의</h1>
        <p className="mb-6 text-sm text-[#56645C]">회원가입 없이 바로 문의하실 수 있어요. 영업일 기준 1일 안에 연락드립니다.</p>
        <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-8">
          <InquiryForm />
          <aside className="ink-card self-start p-5">
            <h2 className="mb-2 font-jua text-xl font-normal">연락처</h2>
            <ul className="space-y-1 text-sm leading-loose">
              <li>📞 {SITE_INFO.phone}</li>
              <li>✉️ {SITE_INFO.email}</li>
              <li>📍 {SITE_INFO.address}</li>
              <li>🕘 {SITE_INFO.hours}</li>
            </ul>
          </aside>
        </div>
      </section>
      <LocationSection />
    </SiteShell>
  );
}
