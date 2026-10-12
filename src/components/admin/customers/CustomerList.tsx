"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, UsersRound } from "lucide-react";
import { useCollection, useToday } from "@/data/hooks";
import { lastContactAt, type CustomerSort } from "@/domain/customers";
import { koreaDate } from "@/domain/dates";
import { normalizePhone } from "@/domain/inquiries";
import { activePayments, receivables } from "@/domain/money";
import type { Customer } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { formatDateKo, formatPhone, formatWon } from "@/lib/format";
import { CustomerDetail } from "./CustomerDetail";
import { CustomerForm } from "./CustomerForm";

interface Row { customer: Customer; activeCount: number; receivable: number; lastContact: string | null }
const SORTS: { value: CustomerSort; label: string }[] = [{ value: "recent", label: "최근 연락순" }, { value: "name", label: "이름순" }, { value: "receivable", label: "미수금순" }];
const isSort = (v: string | null): v is CustomerSort => v === "recent" || v === "name" || v === "receivable";
const contactText = (iso: string | null) => (iso ? formatDateKo(koreaDate(new Date(iso))) : "-");

/** A03 고객리스트. `?id=` 상세, `?new=1` 등록, `?tab=` 상세 탭. */
export function CustomerList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();
  const customers = useCollection("customers");
  const projects = useCollection("projects");
  const payments = useCollection("payments");
  const contracts = useCollection("contracts");
  const inquiries = useCollection("inquiries");
  const activities = useCollection("activities");
  const [query, setQuery] = useState("");
  const sp = params.get("sort");
  const sort: CustomerSort = isSort(sp) ? sp : "recent";
  const detailId = params.get("id");
  const isNew = params.get("new") === "1";
  const loading = customers.loading || projects.loading || payments.loading || contracts.loading || inquiries.loading || activities.loading;

  const go = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const rows = useMemo<Row[]>(() => customers.items.map(c => ({
    customer: c,
    activeCount: projects.items.filter(p => p.customerId === c.id && p.status === "active").length,
    receivable: receivables(activePayments(payments.items, contracts.items).filter(p => p.customerId === c.id), today).overdueAmount,
    lastContact: lastContactAt(c, { inquiries: inquiries.items, projects: projects.items, activities: activities.items }),
  })), [customers.items, projects.items, payments.items, contracts.items, inquiries.items, activities.items, today]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase(), digits = normalizePhone(q);
    const list = rows.filter(r => !q || r.customer.name.toLowerCase().includes(q) || (r.customer.company ?? "").toLowerCase().includes(q)
      || (digits.length > 0 && normalizePhone(r.customer.phone).includes(digits)) || r.customer.sites.some(s => s.toLowerCase().includes(q)));
    const byName = (a: Row, b: Row) => a.customer.name.localeCompare(b.customer.name, "ko");
    return list.sort((a, b) => sort === "name" ? byName(a, b)
      : sort === "receivable" ? (b.receivable - a.receivable || byName(a, b))
      : ((b.lastContact ?? "").localeCompare(a.lastContact ?? "") || byName(a, b)));
  }, [rows, query, sort]);

  const detail = detailId ? customers.items.find(c => c.id === detailId) ?? null : null;
  const addBtn = (cls: string) => (
    <button type="button" onClick={() => go({ new: "1" })} className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark ${cls}`}>
      <Plus className="size-4" aria-hidden />고객 등록
    </button>
  );

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "고객명", cell: r => <span className="font-bold">{r.customer.name}</span> },
    { key: "company", header: "업체명", cell: r => r.customer.company ?? "-" },
    { key: "phone", header: "연락처", cell: r => <span className="whitespace-nowrap">{formatPhone(r.customer.phone)}</span> },
    { key: "site", header: "대표 현장", showFrom: "lg", cell: r => <span className="line-clamp-1 max-w-64">{r.customer.sites[0] ?? "-"}</span> },
    { key: "active", header: "진행 중 의뢰", align: "right", cell: r => `${r.activeCount}건` },
    { key: "recv", header: "미수금", align: "right", cell: r => (r.receivable > 0 ? <span className="font-bold text-[#B42323]">{formatWon(r.receivable)}</span> : <span className="text-[#9AA59F]">-</span>) },
    { key: "last", header: "최근 연락일", showFrom: "lg", cell: r => <span className="whitespace-nowrap">{contactText(r.lastContact)}</span> },
  ];

  return (
    <>
      {detailId ? (
        loading ? null : detail ? (
          <CustomerDetail key={detail.id} customer={detail} tab={params.get("tab")} onTab={t => go({ tab: t })} />
        ) : (
          <>
            <PageHeader title="고객리스트" back={{ href: pathname, label: "고객 목록" }} />
            <EmptyState icon={UsersRound} title="고객을 찾을 수 없어요" description="이미 삭제됐거나 주소가 잘못됐어요." />
          </>
        )
      ) : (
        <>
          <PageHeader title="고객리스트" description="고객 정보와 의뢰·계약·입금·상담 이력을 한눈에 봐요." actions={addBtn("min-h-11 md:min-h-10")} />
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9AA59F]" aria-hidden />
              <Input aria-label="고객 검색" placeholder="이름·업체명·연락처·현장 검색" className="h-11 bg-white pl-9 md:h-10" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="sm:w-44"><TaskSelect label="정렬" value={sort} options={SORTS} onChange={v => go({ sort: v === "recent" ? null : v })} /></div>
          </div>
          <DataTable rows={visible} columns={columns} rowKey={r => r.customer.id} loading={loading} caption="고객 목록"
            onRowClick={r => go({ id: r.customer.id })} rowLabel={r => `${r.customer.name} 상세 열기`}
            empty={<EmptyState icon={UsersRound} title={query ? "검색 결과가 없어요" : "등록된 고객이 없어요"} description={query ? "다른 검색어를 입력해보세요." : "첫 고객을 등록해보세요."} action={!query ? addBtn("min-h-11") : undefined} />}
            mobileCard={r => (
              <div>
                <div className="flex items-baseline gap-2"><span className="font-bold">{r.customer.name}</span>{r.customer.company && <span className="truncate text-sm text-[#56645C]">{r.customer.company}</span>}</div>
                <div className="mt-0.5 text-sm text-[#56645C]">{formatPhone(r.customer.phone)}</div>
                {r.customer.sites[0] && <div className="mt-0.5 truncate text-xs text-[#7A867F]">{r.customer.sites[0]}</div>}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#56645C]">
                  <span>진행 중 {r.activeCount}건</span>
                  {r.receivable > 0 && <span className="font-bold text-[#B42323]">미수 {formatWon(r.receivable)}</span>}
                  <span className="ml-auto text-[#7A867F]">최근 연락 {contactText(r.lastContact)}</span>
                </div>
              </div>
            )} />
        </>
      )}
      <CustomerForm open={isNew} customer={null} onOpenChange={o => { if (!o) go({ new: null }); }} onSaved={c => go({ new: null, id: c.id })} />
    </>
  );
}
