"use client";
import { useState } from "react";
import { PrivacyDialog } from "@/components/common/PrivacyDialog";
import { SITE_INFO } from "./siteInfo";

export function SiteFooter() {
  const [privacy, setPrivacy] = useState(false);
  return (
    <footer className="bg-ink text-[13px] leading-relaxed text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:justify-between md:px-8">
        <div className="space-y-1">
          <div className="font-jua text-lg text-white">{SITE_INFO.name}</div>
          <p>{SITE_INFO.ceo} · 사업자등록번호 {SITE_INFO.bizNo}</p>
          <p>{SITE_INFO.address}</p>
          <p>전화 {SITE_INFO.phone} · {SITE_INFO.email}</p>
          <p>{SITE_INFO.hours}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button type="button" onClick={() => setPrivacy(true)} className="min-h-11 font-bold text-white underline underline-offset-2">
            개인정보처리방침
          </button>
          <span>© 2026 GreenNarae</span>
        </div>
      </div>
      <PrivacyDialog open={privacy} onOpenChange={setPrivacy} />
    </footer>
  );
}
