import Link from "next/link";
import { STAGE_ORDER, stageColor, stageLabel } from "@/domain/defaults";
import type { Project, Settings } from "@/domain/types";

/** 5단계 화살표 막대: 단계 색 + 진행 중 의뢰 수. */
export function PipelineBar({ projects, settings }: { projects: Project[]; settings: Settings }) {
  const active = projects.filter(p => p.status === "active");
  return (
    <section aria-labelledby="pipeline" className="mb-4 md:mb-6">
      <h2 id="pipeline" className="mb-2 text-sm font-bold text-[#1F2A24]">의뢰 진행 현황</h2>
      <ol className="flex">
        {STAGE_ORDER.map((k, i) => {
          const n = active.filter(p => p.stage === k).length;
          return (
            <li key={k} className="min-w-0 flex-1" style={{ marginLeft: i ? -6 : 0 }}>
              <Link
                href={`/admin/projects?stage=${k}`}
                className="flex h-16 flex-col items-center justify-center text-center text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2A24] md:h-[72px]"
                style={{ background: stageColor(settings, k), clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)", paddingInline: 14 }}
              >
                <span className="w-full text-[10px] font-bold leading-tight break-keep md:text-xs drop-shadow-sm">{stageLabel(settings, k)}</span>
                <span className="text-lg font-black leading-tight drop-shadow-sm">{n}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
