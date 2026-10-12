"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useCollection } from "@/data/hooks";
import type { LedgerSummary } from "@/domain/money";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import { formatWon } from "@/lib/format";
import { TrendingUp } from "lucide-react";

type Row = LedgerSummary["byProject"][number];
const money = (n: number) => `${n < 0 ? "-" : ""}${formatWon(Math.abs(n))}`;

/** 의뢰별 손익(이익 큰 순 상위 10). 의뢰 이름은 의뢰 상세로 연결. */
export function ProjectProfitTable({ byProject }: { byProject: LedgerSummary["byProject"] }) {
  const projects = useCollection("projects");
  const titles = useMemo(() => new Map(projects.items.map(p => [p.id, p.title])), [projects.items]);
  const rows = byProject.slice(0, 10);
  const title = (r: Row) => <Link href={`/admin/projects?id=${r.projectId}`} className="line-clamp-2 font-bold text-[#1E6E41] hover:underline">{titles.get(r.projectId) ?? "(삭제된 의뢰)"}</Link>;
  const diff = (r: Row) => <span className={cn("font-bold", r.diff < 0 && "text-[#B42323]")}>{money(r.diff)}{r.diff < 0 && <span className="ml-1 text-xs">적자</span>}</span>;
  const columns: DataTableColumn<Row>[] = [
    { key: "proj", header: "의뢰", cell: title },
    { key: "sales", header: "매출", align: "right", cell: r => formatWon(r.sales) },
    { key: "purchases", header: "매입", align: "right", cell: r => formatWon(r.purchases) },
    { key: "diff", header: "손익", align: "right", cell: diff },
  ];
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-bold">의뢰별 손익 <span className="text-sm font-normal text-[#56645C]">상위 10 · 공급가 기준</span></h2>
      <DataTable rows={rows} columns={columns} rowKey={r => r.projectId} loading={projects.loading} caption="의뢰별 손익"
        empty={<EmptyState icon={TrendingUp} title="의뢰에 연결된 내역이 없어요" description="매입·매출에 의뢰를 연결하면 의뢰별 손익을 볼 수 있어요." />}
        mobileCard={r => (
          <div>
            <div className="min-w-0">{title(r)}</div>
            <dl className="mt-1 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-[#56645C]">매출</dt><dd>{formatWon(r.sales)}</dd></div><div><dt className="text-[#56645C]">매입</dt><dd>{formatWon(r.purchases)}</dd></div><div><dt className="text-[#56645C]">손익</dt><dd>{diff(r)}</dd></div></dl>
          </div>
        )} />
    </section>
  );
}
