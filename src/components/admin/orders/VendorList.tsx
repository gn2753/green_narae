"use client";
import { useMemo } from "react";
import { Factory, Phone } from "lucide-react";
import { useCollection } from "@/data/hooks";
import type { Vendor } from "@/domain/types";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatWon } from "@/lib/format";

/** 제작업체 목록: 발주 건수·누적 금액 포함. 행을 누르면 수정. */
export function VendorList({ onEdit, onAdd }: { onEdit: (v: Vendor) => void; onAdd: () => void }) {
  const vendors = useCollection("vendors");
  const orders = useCollection("orders");
  const stats = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    for (const o of orders.items) { const s = m.get(o.vendorId) ?? { count: 0, total: 0 }; s.count++; s.total += o.amount; m.set(o.vendorId, s); }
    return m;
  }, [orders.items]);
  const rows = useMemo(() => [...vendors.items].sort((a, b) => (stats.get(b.id)?.total ?? 0) - (stats.get(a.id)?.total ?? 0) || a.name.localeCompare(b.name, "ko")), [vendors.items, stats]);
  const st = (v: Vendor) => stats.get(v.id) ?? { count: 0, total: 0 };
  const phone = (v: Vendor) => (v.phone ? <a href={`tel:${v.phone}`} className="inline-flex min-h-11 items-center gap-1 text-[#1E6E41] hover:underline md:min-h-0"><Phone className="size-3.5" aria-hidden />{v.phone}</a> : "-");

  const columns: DataTableColumn<Vendor>[] = [
    { key: "name", header: "업체명", cell: v => <span className="font-bold">{v.name}</span> },
    { key: "field", header: "분야", cell: v => <StatusBadge tone="gray">{v.field}</StatusBadge> },
    { key: "contact", header: "담당자", cell: v => v.contactName ?? "-" },
    { key: "phone", header: "연락처", cell: phone },
    { key: "count", header: "발주 건수", align: "right", cell: v => `${st(v).count}건` },
    { key: "total", header: "누적 금액", align: "right", cell: v => <span className="font-bold">{formatWon(st(v).total)}</span> },
    { key: "memo", header: "메모", showFrom: "lg", cell: v => <span className="line-clamp-2 max-w-60 text-[#56645C]">{v.memo ?? "-"}</span> },
  ];
  return (
    <DataTable rows={rows} columns={columns} rowKey={v => v.id} loading={vendors.loading || orders.loading} caption="제작업체" onRowClick={onEdit} rowLabel={v => v.name}
      empty={<EmptyState icon={Factory} title="등록된 제작업체가 없어요" description="발주를 맡길 업체를 먼저 등록해주세요." action={<button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">새 업체 등록</button>} />}
      mobileCard={v => (
        <div>
          <div className="flex items-start justify-between gap-2"><p className="font-bold">{v.name}</p><StatusBadge tone="gray">{v.field}</StatusBadge></div>
          <p className="mt-0.5 text-sm text-[#56645C]">{v.contactName ?? "담당자 미등록"}</p>
          <div className="mt-1">{phone(v)}</div>
          <p className="mt-1 text-sm">발주 {st(v).count}건 · <span className="font-bold">{formatWon(st(v).total)}</span></p>
          {v.memo && <p className="mt-1 line-clamp-2 text-xs text-[#56645C]">{v.memo}</p>}
        </div>
      )} />
  );
}
