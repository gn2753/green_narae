import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { featureHref, type Feature, type Phase } from "./featureCatalog";

const PHASE_STYLE: Record<Phase, string> = {
  "1차 동작": "bg-[#DDF3E4] text-[#1D6B3F] border-[#9FD6B3]",
  "1차 화면": "bg-[#FFF0C2] text-[#7A5600] border-[#EBCB6A]",
  "2차": "bg-[#E9ECEF] text-[#4A545C] border-[#C4CAD0]",
};

export function PhaseBadge({ phase, className }: { phase: Phase; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-bold", PHASE_STYLE[phase], className)}>
      {phase}
    </span>
  );
}

function GoLink({ feature }: { feature: Feature }) {
  return (
    <Link
      href={featureHref(feature)}
      aria-label={`${feature.title} 바로가기`}
      className="inline-flex min-h-11 items-center gap-1 rounded-lg border-2 border-ink bg-white px-3 text-sm font-bold text-ink hover:bg-cream"
    >
      바로가기 <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

function ItemList({ items }: { items: Feature["items"] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.text} className="flex items-start gap-2 text-sm leading-relaxed">
          <PhaseBadge phase={it.phase} className="mt-0.5" />
          <span className="min-w-0">{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureTable({ features }: { features: Feature[] }) {
  return (
    <>
      {/* 데스크톱·태블릿: 표 */}
      <div className="ink-card hidden overflow-hidden md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-[#F1F3F0] text-xs text-[#56645C]">
            <tr>
              <th className="w-[72px] px-3 py-2.5 font-bold">ID</th>
              <th className="w-[26%] px-3 py-2.5 font-bold">화면과 요약</th>
              <th className="px-3 py-2.5 font-bold">기능 목록</th>
              <th className="w-[132px] px-3 py-2.5 font-bold">확인</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.id} className="border-t border-[#DDE2DC] align-top">
                <td className="px-3 py-3 font-jua text-lg text-brand">{f.id}</td>
                <td className="px-3 py-3">
                  <div className="font-bold">{f.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-[#56645C]">{f.summary}</div>
                  <code className="mt-1 block break-all text-xs text-[#7A857E]">{f.path}</code>
                </td>
                <td className="px-3 py-3"><ItemList items={f.items} /></td>
                <td className="px-3 py-3"><GoLink feature={f} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일: 카드 */}
      <ul className="space-y-3 md:hidden">
        {features.map((f) => (
          <li key={f.id} className="ink-card p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-jua text-lg text-brand">{f.id}</span>
              <span className="font-bold">{f.title}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[#56645C]">{f.summary}</p>
            <div className="mt-3"><ItemList items={f.items} /></div>
            <div className="mt-3"><GoLink feature={f} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
