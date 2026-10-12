"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useCollection, useToday } from "@/data/hooks";
import { chartMonths, isPeriodKind, periodRange, type PeriodKind } from "@/domain/ledgerPeriod";
import { ledgerSummary } from "@/domain/money";
import type { ISODate, LedgerEntry } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { cn } from "@/lib/utils";
import { LedgerCharts } from "./LedgerCharts";
import { LedgerForm } from "./LedgerForm";
import { LedgerSummaryCards } from "./LedgerSummaryCards";
import { LedgerTable } from "./LedgerTable";
import { PeriodPicker } from "./PeriodPicker";
import { ProjectProfitTable } from "./ProjectProfitTable";

type Tab = "all" | "purchase" | "sale";
const TABS: { key: Tab; label: string }[] = [{ key: "all", label: "전체" }, { key: "purchase", label: "매입" }, { key: "sale", label: "매출" }];
const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-bold md:min-h-10";

/** A06 매입·매출. `?tab=all|purchase|sale`, `?period=month|lastMonth|quarter|year|custom&from=&to=`, `?new=purchase|sale`. */
export function LedgerWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();
  const { items: ledger, loading } = useCollection("ledger");

  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "purchase" || tabParam === "sale" ? tabParam : "all";
  const pp = params.get("period");
  const kind: PeriodKind = isPeriodKind(pp) ? pp : "month";
  const { from, to } = useMemo(() => periodRange(kind, today, { from: params.get("from") ?? undefined, to: params.get("to") ?? undefined }), [kind, today, params]);
  const newParam = params.get("new");
  const newType = newParam === "purchase" || newParam === "sale" ? newParam : null;

  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"purchase" | "sale">("purchase");
  const [handledNew, setHandledNew] = useState<string | null>(null);
  if (newType && handledNew !== newType) { setHandledNew(newType); setEditing(null); setFormType(newType); setFormOpen(true); }
  if (!newType && handledNew) setHandledNew(null);

  const go = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) q.delete(k); else q.set(k, v); }
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const inRange = useMemo(() => ledger.filter(e => e.date >= from && e.date <= to), [ledger, from, to]);
  const summary = useMemo(() => ledgerSummary(ledger, from, to), [ledger, from, to]);
  const salesCount = inRange.filter(e => e.type === "sale").length;
  const purchaseCount = inRange.length - salesCount;
  const months = useMemo(() => {
    const list = chartMonths(from, to);
    const s = ledgerSummary(ledger, `${list[0]}-01` as ISODate, `${list[list.length - 1]}-31` as ISODate);
    const by = new Map(s.byMonth.map(m => [m.month, m]));
    return list.map(m => by.get(m) ?? { month: m, sales: 0, purchases: 0 });
  }, [ledger, from, to]);
  const monthsNote = months.length === 6 && from.slice(0, 7) === to.slice(0, 7) ? "최근 6개월" : `${months[0].month} ~ ${months[months.length - 1].month}`;
  const rows = useMemo(() => inRange.filter(e => tab === "all" || e.type === tab).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [inRange, tab]);
  const tabCount = (t: Tab) => (t === "all" ? inRange.length : t === "sale" ? salesCount : purchaseCount);

  const open = (type: "purchase" | "sale", entry: LedgerEntry | null) => { setFormType(type); setEditing(entry); setFormOpen(true); };
  const onForm = (o: boolean) => { setFormOpen(o); if (!o && newType) go({ new: null }); };

  const actions = (
    <>
      <button type="button" onClick={() => open("purchase", null)} className={cn(btn, "bg-brand text-white hover:bg-brand-dark")}><Plus className="size-4" aria-hidden />매입 등록</button>
      <button type="button" onClick={() => open("sale", null)} className={cn(btn, "border border-[#D5DDD8] bg-white hover:bg-[#F6F7F5]")}><Plus className="size-4" aria-hidden />매출 등록</button>
    </>
  );

  return (
    <>
      <PageHeader title="매입·매출" description="기간별 매출·매입과 의뢰별 손익을 확인해요." actions={actions} />
      <PeriodPicker kind={kind} from={from} to={to}
        onKind={k => go({ period: k === "month" ? null : k, ...(k === "custom" ? { from, to } : { from: null, to: null }) })}
        onCustom={(f, t) => go({ period: "custom", from: f || null, to: t || null })} />
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-[#EEF1EF]" aria-label="불러오는 중" /> : (
        <>
          <LedgerSummaryCards summary={summary} salesCount={salesCount} purchaseCount={purchaseCount} />
          <LedgerCharts months={months} categories={summary.byCategory} monthsNote={monthsNote} />
        </>
      )}
      <div role="group" aria-label="구분 필터" className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => go({ tab: t.key === "all" ? null : t.key })}
            className={cn("inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-bold md:min-h-9", tab === t.key ? "border-brand bg-brand text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5]")}>
            {t.label} {tabCount(t.key)}
          </button>
        ))}
      </div>
      <LedgerTable rows={rows} onEdit={e => open(e.type, e)} onAdd={() => open(tab === "sale" ? "sale" : "purchase", null)} />
      <ProjectProfitTable byProject={summary.byProject} />
      <LedgerForm open={formOpen} type={formType} entry={editing} onOpenChange={onForm} />
    </>
  );
}
