import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { FeatureTable, PhaseBadge } from "@/components/review/FeatureTable";
import {
  DECISIONS, FEATURES, GROUPS, OUT_OF_SCOPE_NOTE, PHASE_DESCRIPTIONS, REVIEW_STEPS, featureHref,
} from "@/components/review/featureCatalog";

export const metadata: Metadata = {
  title: "기능 안내",
  description: "그린나래디자인 1차 시안의 모든 화면과 기능을 한눈에 보고 눌러 볼 수 있는 안내 페이지입니다.",
};

const PHASES = ["1차 동작", "1차 화면", "2차"] as const;

export default function ReviewPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <header className="mb-8">
          <div className="font-jua text-sm text-coral">GUIDE</div>
          <h1 className="mb-3 font-jua text-3xl text-ink md:text-4xl">그린나래디자인 1차 시안 확인 페이지</h1>
          <ol className="ink-card space-y-2 p-4 text-sm leading-relaxed md:p-5 md:text-base">
            <li><b className="mr-1 text-brand">1.</b>아래 표에서 각 화면의 <b>바로가기</b>를 눌러 직접 눌러 보세요.</li>
            <li><b className="mr-1 text-brand">2.</b>관리자 화면은 로그인 화면에서 <b>김자연으로 보기</b>(또는 최관웅으로 보기)를 누르면 들어갈 수 있어요.</li>
            <li><b className="mr-1 text-brand">3.</b>입력한 내용은 <b>이 브라우저에만 저장</b>되고, 화면 맨 위 <b>초기화</b>를 누르면 처음 상태로 돌아갑니다.</li>
          </ol>
        </header>

        <section aria-labelledby="legend" className="mb-10">
          <h2 id="legend" className="mb-3 font-jua text-xl font-normal">표시 안내</h2>
          <ul className="grid gap-2 md:grid-cols-3">
            {PHASES.map((p) => (
              <li key={p} className="rounded-xl border-2 border-ink bg-white p-3">
                <PhaseBadge phase={p} />
                <p className="mt-2 text-sm leading-relaxed text-[#56645C]">{PHASE_DESCRIPTIONS[p]}</p>
              </li>
            ))}
          </ul>
        </section>

        {GROUPS.map((group) => {
          const features = FEATURES.filter((f) => f.group === group);
          return (
            <section key={group} aria-labelledby={`g-${group}`} className="mb-10">
              <h2 id={`g-${group}`} className="mb-3 font-jua text-2xl font-normal">{group}</h2>
              <FeatureTable features={features} />
            </section>
          );
        })}

        <p className="mb-10 flex items-start gap-2 rounded-xl border-2 border-dashed border-ink bg-white p-4 text-sm leading-relaxed">
          <Info className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
          <span>{OUT_OF_SCOPE_NOTE}</span>
        </p>

        <section aria-labelledby="decisions" className="mb-10">
          <h2 id="decisions" className="mb-1 font-jua text-2xl font-normal">결정이 필요한 항목</h2>
          <p className="mb-3 text-sm text-[#56645C]">아래 내용을 알려 주시면 다음 단계에 반영하겠습니다.</p>
          <ul className="grid gap-4 md:grid-cols-2">
            {DECISIONS.map((d) => (
              <li key={d.title} className="ink-card p-4">
                <h3 className="mb-2 font-bold">{d.title}</h3>
                <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {d.options.map((o) => <li key={o}>{o}</li>)}
                </ul>
                <p className="rounded-lg bg-[#FFF0C2] px-3 py-2 text-sm leading-relaxed"><b>추천</b> · {d.recommendation}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps">
          <h2 id="steps" className="mb-1 font-jua text-2xl font-normal">추천 확인 순서</h2>
          <p className="mb-3 text-sm text-[#56645C]">이 순서대로 누르면 문의가 들어와서 시공사례가 되기까지의 흐름을 한 번에 볼 수 있어요.</p>
          <ol className="grid gap-3 md:grid-cols-2">
            {REVIEW_STEPS.map((s, i) => (
              <li key={s.title} className="ink-card flex items-center gap-3 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-jua text-lg text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{s.title}</div>
                  <div className="text-sm leading-relaxed text-[#56645C]">{s.detail}</div>
                </div>
                <Link
                  href={featureHref(s)}
                  aria-label={`${s.title} 바로가기`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white hover:bg-cream"
                >
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </SiteShell>
  );
}
