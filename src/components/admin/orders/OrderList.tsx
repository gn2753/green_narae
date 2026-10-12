"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Factory } from "lucide-react";
import type { NewDoc } from "@/data/repository";
import { useAdmin, useCollection, useMutation, useRepo, useToday } from "@/data/hooks";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/domain/defaults";
import { daysBetween } from "@/domain/dates";
import type { LedgerEntry, OrderStatus, PurchaseOrder } from "@/domain/types";
import { setOrderStatus } from "@/services/moneyService";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { LedgerSuggestDialog } from "@/components/admin/payments/LedgerSuggestDialog";
import { cn } from "@/lib/utils";
import { formatDateKo, formatWon } from "@/lib/format";
import { OrderStatusStepper } from "./OrderStatusStepper";

export type OrderFilter = "all" | OrderStatus;
export const isOrderFilter = (v: string | null): v is OrderFilter => v === "all" || ORDER_STATUS_ORDER.includes(v as OrderStatus);

/** 발주 목록: 상태 필터 · 스텝 클릭으로 다음 상태 · 수령완료 시 매입 등록 제안. `?id=` 해당 행 강조. */
export function OrderList({ filter, highlightId, onEdit, onAdd }: { filter: OrderFilter; highlightId: string | null; onEdit: (o: PurchaseOrder) => void; onAdd: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const repo = useRepo();
  const { admin } = useAdmin();
  const today = useToday();
  const { run } = useMutation();
  const orders = useCollection("orders");
  const vendors = useCollection("vendors");
  const projects = useCollection("projects");
  const loading = orders.loading || vendors.loading || projects.loading;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewDoc<LedgerEntry> | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const vendorName = useCallback((id: string) => vendors.items.find(v => v.id === id)?.name ?? "(삭제된 업체)", [vendors.items]);
  const projectTitle = useCallback((id: string | null) => (id ? projects.items.find(p => p.id === id)?.title ?? "-" : "-"), [projects.items]);

  const counts = useMemo(() => {
    const c: Record<OrderFilter, number> = { all: orders.items.length, requested: 0, producing: 0, shipped: 0, received: 0 };
    for (const o of orders.items) c[o.status]++;
    return c;
  }, [orders.items]);
  const rows = useMemo(() => orders.items.filter(o => filter === "all" || o.status === filter)
    .sort((a, b) => Number(a.status === "received") - Number(b.status === "received") || a.dueDate.localeCompare(b.dueDate)), [orders.items, filter]);
  const isLate = (o: PurchaseOrder) => o.status !== "received" && o.dueDate < today;

  useEffect(() => {
    if (!highlightId || loading) return;
    const t = setTimeout(() => document.getElementById(`order-${highlightId}`)?.scrollIntoView({ block: "center" }), 100);
    return () => clearTimeout(t);
  }, [highlightId, loading, filter]);

  const advance = async (o: PurchaseOrder, next: OrderStatus) => {
    if (!admin || busyId) return;
    setBusyId(o.id);
    const r = await run(() => setOrderStatus(repo, o.id, next, admin.id), `${ORDER_STATUS_LABEL[next]}(으)로 바꿨어요`);
    setBusyId(null);
    if (r?.ledgerDraft) { setDraft(r.ledgerDraft); setSuggestOpen(true); }
  };

  const setFilter = (f: OrderFilter) => router.replace(f === "all" ? pathname : `${pathname}?status=${f}`, { scroll: false });
  const stepper = (o: PurchaseOrder, compact = false) => <OrderStatusStepper compactBelowXl={compact} status={o.status} disabled={busyId === o.id || !admin} onAdvance={n => advance(o, n)} />;
  const due = (o: PurchaseOrder) => (
    <span className={cn("whitespace-nowrap", isLate(o) && "font-bold text-[#B42323]")}>{formatDateKo(o.dueDate)}{isLate(o) && <span className="ml-1.5 text-xs">{daysBetween(o.dueDate, today)}일 지연</span>}</span>
  );
  const projLink = (o: PurchaseOrder) => (o.projectId
    ? <Link href={`/admin/projects?id=${o.projectId}`} className="line-clamp-2 max-w-52 text-[#1E6E41] hover:underline">{projectTitle(o.projectId)}</Link> : <span className="text-[#9AA59F]">-</span>);

  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: "proj", header: "의뢰", cell: o => <span id={`order-${o.id}`}>{projLink(o)}</span> },
    { key: "vendor", header: "업체", cell: o => vendorName(o.vendorId) },
    { key: "item", header: "품목", cell: o => <span className="line-clamp-2 max-w-48 font-bold">{o.item}</span> },
    { key: "amount", header: "금액", align: "right", cell: o => <span className="font-bold">{formatWon(o.amount)}</span> },
    { key: "ordered", header: "발주일", showFrom: "lg", cell: o => formatDateKo(o.orderedOn) },
    { key: "due", header: "납기", cell: due },
    { key: "status", header: "상태", cell: o => stepper(o, true) },
    { key: "received", header: "수령 확인일", showFrom: "lg", cell: o => (o.receivedOn ? formatDateKo(o.receivedOn) : "-") },
  ];

  return (
    <>
      <div role="group" aria-label="상태 필터" className="mb-3 flex flex-wrap gap-1.5">
        {(["all", ...ORDER_STATUS_ORDER] as OrderFilter[]).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={cn("inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-bold md:min-h-9", filter === f ? "border-brand bg-brand text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5]")}>
            {f === "all" ? "전체" : ORDER_STATUS_LABEL[f]} {counts[f]}
          </button>
        ))}
      </div>
      <DataTable rows={rows} columns={columns} rowKey={o => o.id} loading={loading} caption="발주 목록" onRowClick={onEdit} rowLabel={o => o.item}
        rowClassName={o => (o.id === highlightId ? "bg-[#FFF8E0] ring-2 ring-[#E0A800] ring-inset" : undefined)}
        empty={<EmptyState icon={Factory} title="발주가 없어요" description={filter === "all" ? "제작업체에 맡긴 품목을 발주로 등록해 납기와 수령을 관리하세요." : "이 상태의 발주가 없어요."}
          action={filter === "all" ? <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">발주 등록</button> : undefined} />}
        mobileCard={o => (
          <div id={`order-${o.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-bold break-words">{o.item}</p><p className="text-sm text-[#56645C]">{vendorName(o.vendorId)}</p></div>
              <p className="shrink-0 font-bold">{formatWon(o.amount)}</p>
            </div>
            <div className="mt-1 text-sm">{projLink(o)}</div>
            <p className="mt-1 text-xs text-[#56645C]">발주 {formatDateKo(o.orderedOn)} · 납기 {due(o)}{o.receivedOn && <> · 수령 {formatDateKo(o.receivedOn)}</>}</p>
            <div className="mt-2">{stepper(o)}</div>
          </div>
        )} />
      <LedgerSuggestDialog draft={draft} open={suggestOpen} onOpenChange={setSuggestOpen} />
    </>
  );
}
