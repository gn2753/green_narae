import { SectionTitle } from "../SectionTitle";

const ITEMS = [
  { icon: "🎨", title: "디자인이 다릅니다", desc: "가게 분위기와 업종에 맞춘 맞춤 시안. 로고가 없어도 함께 만들어 드려요." },
  { icon: "🚚", title: "직접 시공합니다", desc: "고소작업차 보유, 실측부터 설치·A/S까지 저희가 직접 갑니다." },
  { icon: "🏘️", title: "우리 동네 업체", desc: "가까워서 빠르고, 시공 후에도 언제든 들러 봐 드립니다." },
];

export function Strengths() {
  return (
    <section className="border-y-2 border-ink bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
        <SectionTitle eyebrow="WHY 그린나래" title="디자인하는 사람이 직접 달아요" lead="중간 업체 없이 한 팀이 끝까지. 그래서 시안과 실물이 똑같습니다." />
        <div className="grid gap-4 md:grid-cols-3">
          {ITEMS.map((s) => (
            <div key={s.title} className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-[4px_4px_0_var(--color-ink)]">
              <div className="text-[28px]" aria-hidden>{s.icon}</div>
              <h3 className="mb-1.5 mt-2.5 font-jua text-[19px]">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#56645C]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
