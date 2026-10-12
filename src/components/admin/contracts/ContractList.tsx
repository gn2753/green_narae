"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, Clock, FileText, Plus } from "lucide-react";
import { useCollection, useToday } from "@/data/hooks";
import { CONTRACT_STATUS_LABEL } from "@/domain/defaults";
import { activePayments } from "@/domain/money";
import type { Contract } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateKo, formatWon } from "@/lib/format";
import { ContractDetail } from "./ContractDetail";
import { ContractForm } from "./ContractForm";
import { CONTRACT_STATUSES, CONTRACT_TONE, isContractStatus, nextDueDate, slotPayment } from "./contractUtils";

/** A04 견적·계약. `?status=` 필터, `?id=` 상세, `?new=1`(+`&customer=`/`&project=`) 등록. */
export function ContractList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();
  const contracts = useCollection("contracts");
  const customers = useCollection("customers");
  const projects = useCollection("projects");
  const rawPayments = useCollection("payments");
  const payments = useMemo(() => ({ items: activePayments(rawPayments.items, contracts.items), loading: rawPayments.loading }), [rawPayments, contracts.items]);
  const loading = contracts.loading || customers.loading || projects.loading || payments.loading;
  const sp = params.get("status");
  const status = isContractStatus(sp) ? sp : null;
  const detailId = params.get("id");
  const isNew = params.get("new") === "1";
  const preProject = params.get("project");
  const preCustomer = params.get("customer") ?? projects.items.find(p => p.id === preProject)?.customerId ?? undefined;

  const go = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const customerLabel = useCallback((id: string) => { const c = customers.items.find(x => x.id === id); return c ? { name: c.name, company: c.company } : { name: "(삭제된 고객)", company: undefined }; }, [customers.items]);
  const projectTitle = useCallback((id: string | null) => (id ? projects.items.find(p => p.id === id)?.title ?? "-" : "-"), [projects.items]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: contracts.items.length };
    for (const s of CONTRACT_STATUSES) m[s] = contracts.items.filter(c => c.status === s).length;
    return m;
  }, [contracts.items]);
  const rows = useMemo(() => contracts.items.filter(c => !status || c.status === status).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [contracts.items, status]);
  const month = today.slice(0, 7);
  const monthTotal = contracts.items.filter(c => c.status === "signed" && (c.signedOn ?? "").startsWith(month)).reduce((s, c) => s + (c.contractAmount ?? 0), 0);
  const quoting = contracts.items.filter(c => c.status === "draft" || c.status === "sent").length;

  const tabs = [{ key: "all", label: "전체", s: null as string | null }, ...CONTRACT_STATUSES.map(s => ({ key: s, label: CONTRACT_STATUS_LABEL[s], s }))]
    .map(t => ({ label: `${t.label} ${counts[t.key] ?? 0}`, href: t.s ? `${pathname}?status=${t.s}` : pathname, active: (status ?? null) === t.s }));

  const detail = detailId ? contracts.items.find(c => c.id === detailId) ?? null : null;
  const backHref = status ? `${pathname}?status=${status}` : pathname;
  const addBtn = (cls: string) => (
    <button type="button" onClick={() => go({ new: "1" })} className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark ${cls}`}>
      <Plus className="size-4" aria-hidden />견적·계약 등록
    </button>
  );

  const slot = (c: Contract, kind: "deposit" | "balance") => {
    const p = slotPayment(payments.items, c, kind);
    const plan = p ? { amount: p.amount, dueDate: p.dueDate } : c[kind]; if (!plan) return <span className="text-[#9AA59F]">-</span>;
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {p?.paidOn ? <CircleCheck className="size-4 text-[#2F8F57]" aria-label="입금확인" /> : p ? <Clock className={`size-4 ${p.dueDate < today ? "text-[#D64545]" : "text-[#E0A800]"}`} aria-label={p.dueDate < today ? "미수" : "입금 예정"} /> : <span className="size-4" aria-hidden />}
        <span>{formatWon(plan.amount)}</span><span className="text-xs text-[#7A867F]">{formatDateKo(plan.dueDate)}</span>
      </span>
    );
  };

  const columns: DataTableColumn<Contract>[] = [
    { key: "cust", header: "고객·업체", cell: c => { const l = customerLabel(c.customerId); return <span><span className="font-bold">{l.name}</span>{l.company && <span className="block text-xs text-[#7A867F]">{l.company}</span>}</span>; } },
    { key: "proj", header: "의뢰명", cell: c => <span className="line-clamp-2 max-w-56">{projectTitle(c.projectId)}</span> },
    { key: "quote", header: "견적 금액", align: "right", cell: c => formatWon(c.quoteAmount) },
    { key: "amount", header: "계약 금액", align: "right", cell: c => (c.contractAmount !== undefined ? <span className="font-bold">{formatWon(c.contractAmount)}</span> : "-") },
    { key: "status", header: "상태", cell: c => <StatusBadge tone={CONTRACT_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</StatusBadge> },
    { key: "dep", header: "계약금", showFrom: "lg", cell: c => slot(c, "deposit") },
    { key: "bal", header: "잔금", showFrom: "lg", cell: c => slot(c, "balance") },
    { key: "next", header: "다음 입금 예정일", showFrom: "lg", cell: c => { const d = nextDueDate(payments.items, c); return d ? <span className="whitespace-nowrap">{formatDateKo(d)}</span> : "-"; } },
  ];

  if (detailId) {
    return (
      <>
        {loading ? null : detail ? <ContractDetail key={detail.id} contract={detail} backHref={backHref} /> : (
          <>
            <PageHeader title="견적·계약" back={{ href: backHref, label: "견적·계약 목록" }} />
            <EmptyState icon={FileText} title="견적·계약을 찾을 수 없어요" description="이미 삭제됐거나 주소가 잘못됐어요." />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="견적·계약" description="견적 작성부터 계약 완료, 계약금·잔금 예정까지 관리해요." actions={addBtn("min-h-11 md:min-h-10")} tabs={tabs} />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4"><p className="text-xs text-[#5F6B64]">이번 달 계약 금액</p><p className="mt-1 text-lg font-black md:text-xl">{formatWon(monthTotal)}</p></div>
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4"><p className="text-xs text-[#5F6B64]">견적 진행</p><p className="mt-1 text-lg font-black md:text-xl">{quoting}건</p></div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={c => c.id} loading={loading} caption="견적·계약 목록"
        onRowClick={c => go({ id: c.id })} rowLabel={c => `${customerLabel(c.customerId).name} 견적·계약 상세 열기`}
        empty={<EmptyState icon={FileText} title={status ? `${CONTRACT_STATUS_LABEL[status]} 상태의 견적·계약이 없어요` : "등록된 견적·계약이 없어요"} description="견적을 작성해서 시작해보세요." action={addBtn("min-h-11")} />}
        mobileCard={c => {
          const l = customerLabel(c.customerId); const d = nextDueDate(payments.items, c);
          return (
            <div>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-bold">{l.name}{l.company && <span className="ml-1.5 text-sm font-normal text-[#56645C]">{l.company}</span>}</p><p className="mt-0.5 truncate text-sm text-[#56645C]">{projectTitle(c.projectId)}</p></div>
                <StatusBadge tone={CONTRACT_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</StatusBadge></div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 text-xs text-[#56645C]"><span>견적 {formatWon(c.quoteAmount)}</span><span className="font-bold text-[#1F2A24]">계약 {c.contractAmount !== undefined ? formatWon(c.contractAmount) : "-"}</span></div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span>계약금 {slot(c, "deposit")}</span><span>잔금 {slot(c, "balance")}</span></div>
              {d && <p className="mt-1 text-xs text-[#7A867F]">다음 입금 예정일 {formatDateKo(d)}</p>}
            </div>
          );
        }} />
      <ContractForm open={isNew && !loading} contract={null} prefill={{ customerId: preCustomer, projectId: preProject ?? undefined }}
        onOpenChange={o => { if (!o) go({ new: null, customer: null, project: null }); }} onSaved={c => go({ new: null, customer: null, project: null, id: c.id })} />
    </>
  );
}
