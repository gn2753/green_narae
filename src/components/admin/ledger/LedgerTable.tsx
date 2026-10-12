"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Factory, ReceiptText, Wallet } from "lucide-react";
import { useCollection } from "@/data/hooks";
import type { LedgerEntry } from "@/domain/types";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateKo, formatWon } from "@/lib/format";

const iconCls = "inline-flex size-11 items-center justify-center rounded-lg text-[#1E6E41] hover:bg-[#F6F7F5] md:size-9";

/** 매입·매출 내역 표. 행을 누르면 수정, 출처 아이콘은 발주(A05)·입금(A07)으로 이동. */
export function LedgerTable({ rows, onEdit, onAdd }: { rows: LedgerEntry[]; onEdit: (e: LedgerEntry) => void; onAdd: () => void }) {
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const projects = useCollection("projects");
  const loading = vendors.loading || customers.loading || projects.loading;
  const vendorMap = useMemo(() => new Map(vendors.items.map(v => [v.id, v.name])), [vendors.items]);
  const customerMap = useMemo(() => new Map(customers.items.map(c => [c.id, c.name])), [customers.items]);
  const projectMap = useMemo(() => new Map(projects.items.map(p => [p.id, p.title])), [projects.items]);
  const party = (e: LedgerEntry) => (e.vendorId ? vendorMap.get(e.vendorId) : e.customerId ? customerMap.get(e.customerId) : undefined) ?? "-";
  const proj = (e: LedgerEntry) => (e.projectId && projectMap.get(e.projectId) ? <Link href={`/admin/projects?id=${e.projectId}`} className="line-clamp-2 max-w-48 text-[#1E6E41] hover:underline">{projectMap.get(e.projectId)}</Link> : <span className="text-[#9AA59F]">-</span>);
  const kind = (e: LedgerEntry) => <StatusBadge tone={e.type === "sale" ? "green" : "yellow"}>{e.type === "sale" ? "매출" : "매입"}</StatusBadge>;
  const source = (e: LedgerEntry) => (e.sourceRef
    ? <Link href={e.sourceRef.kind === "order" ? `/admin/orders?id=${e.sourceRef.id}` : `/admin/payments?id=${e.sourceRef.id}`} aria-label={e.sourceRef.kind === "order" ? "연결된 발주 보기" : "연결된 입금 보기"} title={e.sourceRef.kind === "order" ? "발주 보기" : "입금 보기"} className={iconCls}>
        {e.sourceRef.kind === "order" ? <Factory className="size-4" aria-hidden /> : <Wallet className="size-4" aria-hidden />}</Link>
    : <span className="text-[#9AA59F]">-</span>);

  const columns: DataTableColumn<LedgerEntry>[] = [
    { key: "date", header: "날짜", cell: e => <span className="whitespace-nowrap">{formatDateKo(e.date)}</span> },
    { key: "type", header: "구분", cell: kind },
    { key: "party", header: "거래처", cell: e => party(e) },
    { key: "proj", header: "의뢰", showFrom: "lg", cell: proj },
    { key: "cat", header: "비용 항목", showFrom: "lg", cell: e => e.category ?? "-" },
    { key: "amount", header: "공급가", showFrom: "xl", align: "right", cell: e => <span className="whitespace-nowrap">{formatWon(e.amount)}</span> },
    { key: "vat", header: "부가세", showFrom: "xl", align: "right", cell: e => <span className="whitespace-nowrap">{formatWon(e.vat)}</span> },
    { key: "total", header: "합계", align: "right", cell: e => <span className="whitespace-nowrap font-bold">{formatWon(e.amount + e.vat)}</span> },
    { key: "memo", header: "메모", showFrom: "lg", cell: e => <span className="line-clamp-2 max-w-48 text-[#56645C]">{e.memo ?? "-"}</span> },
    { key: "src", header: "출처", align: "center", cell: source },
  ];
  return (
    <DataTable rows={rows} columns={columns} rowKey={e => e.id} loading={loading} caption="매입·매출 내역" onRowClick={onEdit} rowLabel={e => `${e.type === "sale" ? "매출" : "매입"} ${e.memo ?? party(e)}`}
      empty={<EmptyState icon={ReceiptText} title="이 기간에 내역이 없어요" description="기간을 바꾸거나 매입·매출을 등록해보세요."
        action={<button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">내역 등록</button>} />}
      mobileCard={e => (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="flex items-center gap-2 font-bold">{kind(e)}<span className="truncate">{party(e)}</span></p><p className="mt-0.5 text-xs text-[#56645C]">{formatDateKo(e.date)}{e.category && ` · ${e.category}`}</p></div>
            <div className="shrink-0 text-right"><p className="font-bold">{formatWon(e.amount + e.vat)}</p><p className="text-xs text-[#56645C]">부가세 {formatWon(e.vat)}</p></div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">{proj(e)}{e.memo && <p className="line-clamp-1 text-xs text-[#56645C]">{e.memo}</p>}</div>
            {source(e)}
          </div>
        </div>
      )} />
  );
}
