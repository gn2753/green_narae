import Link from "next/link";
import { HeroScene } from "@/components/illustrations/HeroScene";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-2 px-4 pb-8 pt-4 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:pb-10 md:pt-6">
      <div className="md:order-2">
        <HeroScene className="h-auto w-full" />
      </div>
      <div className="md:order-1">
        <span className="mb-3 inline-block -rotate-2 rounded-full border-2 border-ink bg-white px-3 py-0.5 font-jua text-[13px]">✏️ 디자인 잘하는 간판집</span>
        <h1 className="mb-3 font-jua text-[34px] font-normal leading-[1.22] md:text-[40px] lg:text-[44px]">
          우리 가게 간판,<br />
          <em className="bg-[linear-gradient(transparent_62%,#FFD166_62%)] not-italic text-brand">그리는 것부터</em><br />
          다는 것까지
        </h1>
        <p className="mb-5 text-sm leading-relaxed">
          상담·실측부터 시안 디자인, 제작, 시공까지 한 팀이 직접 합니다.<br />
          중간 업체 없이 끝까지, 시안과 실물이 똑같은 간판을 만들어 드려요.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="ink-btn inline-flex min-h-11 items-center bg-brand px-5 text-sm text-white">무료 상담 신청 →</Link>
          <a href="#portfolio" className="ink-btn inline-flex min-h-11 items-center bg-white px-5 text-sm">시공 사례 보기</a>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#56645C]">
          <li><b className="block font-jua text-[22px] font-normal text-ink">320+</b>누적 시공</li>
          <li><b className="block font-jua text-[22px] font-normal text-ink">무료</b>실측·상담</li>
          <li><b className="block font-jua text-[22px] font-normal text-ink">1:1</b>디자이너 직접 상담</li>
        </ul>
      </div>
    </section>
  );
}
