import { SectionTitle } from "../SectionTitle";

const STEPS = [
  { icon: "💬", label: "문의 접수", sub: "홈페이지·전화" },
  { icon: "📏", label: "상담·실측", sub: "무료 방문" },
  { icon: "🧾", label: "견적", sub: "투명한 견적서" },
  { icon: "🎨", label: "디자인", sub: "시안 2~3안" },
  { icon: "🚚", label: "시공·납품", sub: "직접 설치" },
  { icon: "✅", label: "완료·A/S", sub: "사후 관리" },
];

export function ProcessSteps() {
  return (
    <section className="border-y-2 border-ink bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
        <SectionTitle eyebrow="PROCESS" title="이렇게 진행돼요" lead="평균 1~2주면 우리 가게에 새 간판이 걸립니다." />
        <ol className="relative grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-6 md:gap-x-2.5">
          <span aria-hidden className="absolute left-[8%] right-[8%] top-[29px] z-0 hidden border-t-2 border-dashed border-ink md:block" />
          {STEPS.map((s) => (
            <li key={s.label} className="relative z-10 text-center text-xs text-[#56645C]">
              <div className="mx-auto mb-2 flex size-[58px] items-center justify-center rounded-full border-2 border-ink bg-white text-2xl shadow-[3px_3px_0_var(--color-ink)]" aria-hidden>{s.icon}</div>
              <b className="block font-jua text-[15px] font-normal text-ink">{s.label}</b>
              {s.sub}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
