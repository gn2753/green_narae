"use client";
import { toast } from "sonner";
import { asset } from "@/lib/asset";
import { SITE_INFO } from "../siteInfo";

export function LocationSection() {
  const soon = () => toast("2차에 지도 앱과 연결됩니다");
  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 md:grid-cols-[1.3fr_0.7fr] md:gap-6 md:px-8 md:py-12">
      <div className="relative min-h-52 overflow-hidden rounded-2xl border-2 border-ink bg-[#E8EFE4] shadow-[4px_4px_0_var(--color-ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/samples/map.svg")} alt="그린나래디자인 위치 약도" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <span className="absolute bottom-2.5 right-2.5 rounded-full border-[1.5px] border-ink bg-white px-2.5 py-0.5 text-[11px]">카카오맵 연동 자리(2차)</span>
      </div>
      <div>
        <div className="font-jua text-sm text-coral">LOCATION</div>
        <h2 className="mb-2 font-jua text-2xl md:text-3xl">오시는 길</h2>
        <ul className="text-[13px] leading-loose">
          <li>📍 {SITE_INFO.address}, 1층</li>
          <li>🅿️ 건물 앞 2대 주차 가능</li>
          <li>🕘 {SITE_INFO.hours}</li>
          <li>📞 {SITE_INFO.phone}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={soon} className="ink-btn min-h-11 bg-white px-3 text-xs">카카오맵 길찾기</button>
          <button type="button" onClick={soon} className="ink-btn min-h-11 bg-white px-3 text-xs">네이버 지도</button>
        </div>
      </div>
    </section>
  );
}
