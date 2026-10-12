"use client";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCollection, useSettings, useToday } from "@/data/hooks";
import { addDays } from "@/domain/dates";
import { breakdown, convertedCount, conversionRate, dailySeries, pageStats, uniqueVisits, visitorSummary } from "@/domain/analytics";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatsSummary } from "./StatsSummary";
import { DailyChart, type StatsRange } from "./DailyChart";
import { PageTable } from "./PageTable";
import { SourceChart } from "./SourceChart";
import { DeviceChart } from "./DeviceChart";
import { StatsRulesNote } from "./StatsRulesNote";

const parseRange = (v: string | null): StatsRange => (v === "30" ? 30 : v === "90" ? 90 : 7);

/** 방문 통계. `?range=7|30|90`은 일별 그래프 기간(페이지·유입·기기는 최근 90일, 요약의 전체·전환율은 누적). */
export function StatsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const range = parseRange(params.get("range"));
  const { items: visits, loading } = useCollection("visits");
  const settings = useSettings();
  const today = useToday();
  const excluded = useMemo(() => settings?.excludedVisitorIds ?? [], [settings]);

  const m = useMemo(() => {
    const u = uniqueVisits(visits, excluded);
    const recent = u.filter(v => v.date >= addDays(today, -89)); // 최근 90일
    return {
      total: recent.length,
      converted: convertedCount(u),
      summary: visitorSummary(visits, today, excluded),
      series: dailySeries(visits, today, range, excluded),
      pages: pageStats(recent),
      sources: breakdown(recent, v => v.source),
      devices: breakdown(recent, v => v.device),
      browsers: breakdown(recent, v => v.browser),
      conv: conversionRate(u),
      excludedCount: visits.filter(v => excluded.includes(v.visitorId)).length,
    };
  }, [visits, excluded, today, range]);

  const setRange = (r: StatsRange) => router.replace(r === 7 ? pathname : `${pathname}?range=${r}`, { scroll: false });
  const ready = !loading && settings !== null;

  return (
    <>
      <PageHeader title="방문 통계" description="홈페이지에 몇 명이, 어디서 들어와 무엇을 봤는지 한눈에 봐요." actions={<StatusBadge tone="yellow" dot>1차 시안: 예시 데이터</StatusBadge>} />
      {!ready ? <p className="py-10 text-center text-sm text-[#56645C]">불러오는 중…</p> : (
        <>
          <StatsSummary {...m.summary} conversion={m.conv} converted={m.converted} />
          <DailyChart data={m.series} range={range} onRange={setRange} />
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <PageTable rows={m.pages} />
            <div className="grid min-w-0 gap-3">
              <SourceChart rows={m.sources} />
              <DeviceChart devices={m.devices} browsers={m.browsers} total={m.total} />
            </div>
          </div>
          <StatsRulesNote excludedCount={m.excludedCount} />
        </>
      )}
    </>
  );
}
