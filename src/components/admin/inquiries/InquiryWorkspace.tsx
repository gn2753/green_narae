"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, MessageSquareText, Plus, Search } from "lucide-react";
import { useCollection } from "@/data/hooks";
import { normalizePhone } from "@/domain/inquiries";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useIsMobile } from "@/components/common/useIsMobile";
import { Input } from "@/components/ui/input";
import { InquiryDetail } from "./InquiryDetail";
import { InquiryList } from "./InquiryList";
import { ManualInquiryDialog } from "./ManualInquiryDialog";

type StatusKey = "open" | "answered" | "closed" | "all";
const isStatus = (v: string | null): v is StatusKey => v === "open" || v === "answered" || v === "closed" || v === "all";

/** A09 고객 문의·답변. `?status=` 탭, `?id=` 상세, `?new=1` 문의 등록. */
export function InquiryWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const isMobile = useIsMobile();
  const { items, loading } = useCollection("inquiries");
  const [query, setQuery] = useState("");

  const sp = params.get("status");
  const status: StatusKey = isStatus(sp) ? sp : "open";
  const detailId = params.get("id");
  const isNew = params.get("new") === "1";

  const go = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const sorted = useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items]);
  const openCount = useMemo(() => items.filter(q => q.status === "open").length, [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = normalizePhone(q);
    return sorted.filter(i => (status === "all" || i.status === status) &&
      (!q || i.name.toLowerCase().includes(q) || i.message.toLowerCase().includes(q) || (digits.length > 0 && normalizePhone(i.phone).includes(digits))));
  }, [sorted, status, query]);
  const selected = detailId ? items.find(i => i.id === detailId) ?? null : null;

  const tabs: { key: StatusKey; label: string }[] = [
    { key: "open", label: `미답변 ${openCount}` }, { key: "answered", label: "답변완료" }, { key: "closed", label: "종료" }, { key: "all", label: "전체" },
  ];
  const showList = !isMobile || !detailId;
  const showDetail = !isMobile || !!detailId;
  const addBtn = (cls: string) => <button type="button" onClick={() => go({ new: "1" })} className={`inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark ${cls}`}><Plus className="size-4" aria-hidden />문의 등록</button>;

  return (
    <>
      <PageHeader title="고객 문의·답변" description="홈페이지와 전화·카톡·방문·메일로 받은 모든 문의를 여기서 관리해요." actions={addBtn("")} />
      <div className="md:grid md:grid-cols-[minmax(320px,2fr)_3fr] md:items-start md:gap-6">
        {showList && (
          <div className="space-y-3">
            <div role="tablist" aria-label="문의 상태" className="flex gap-1 overflow-x-auto border-b border-[#E3E8E4]">
              {tabs.map(t => (
                <button key={t.key} type="button" role="tab" aria-selected={status === t.key} onClick={() => go({ status: t.key === "open" ? null : t.key })}
                  className={`min-h-11 shrink-0 border-b-2 px-3 text-sm whitespace-nowrap ${status === t.key ? "border-brand font-bold text-brand" : "border-transparent text-[#56645C] hover:text-[#1F2A24]"}`}>{t.label}</button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9AA59F]" aria-hidden />
              <Input aria-label="문의 검색" placeholder="이름·연락처·내용 검색" className="h-11 bg-white pl-9 md:h-10" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            {loading ? <div className="space-y-2" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="h-[76px] animate-pulse rounded-xl bg-[#E9EEEA]" />)}</div>
              : visible.length === 0 ? (
                <EmptyState icon={Inbox} title={query ? "검색 결과가 없어요" : status === "open" ? "답변할 문의가 없어요" : "문의가 없어요"} description={query ? "다른 검색어를 입력해보세요." : "전화·카톡 문의는 ‘문의 등록’으로 남겨두세요."}
                  action={!query ? addBtn("min-h-11") : undefined} />
              ) : <InquiryList items={visible} selectedId={detailId} onSelect={id => go({ id })} />}
          </div>
        )}
        {showDetail && (
          <div className="md:sticky md:top-20 md:max-h-[calc(100dvh-7rem)] md:overflow-y-auto md:pr-1">
            {selected ? <InquiryDetail key={selected.id} inquiry={selected} onBack={isMobile ? () => go({ id: null }) : undefined} />
              : detailId ? (loading ? null : <EmptyState icon={MessageSquareText} title="문의를 찾을 수 없어요" description="이미 삭제됐거나 주소가 잘못됐어요." />)
              : <EmptyState icon={MessageSquareText} title="문의를 선택하세요" description="왼쪽 목록에서 문의를 누르면 내용과 답변 이력이 보여요." className="py-24" />}
          </div>
        )}
      </div>
      <ManualInquiryDialog open={isNew} onOpenChange={o => { if (!o) go({ new: null }); }} onCreated={q => go({ new: null, id: q.id, status: "all" })} />
    </>
  );
}
