"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/data/hooks";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { NewsAdminList } from "./NewsAdminList";
import { NewsEditor } from "./NewsEditor";
import { PortfolioAdminList } from "./PortfolioAdminList";
import { PortfolioEditor } from "./PortfolioEditor";

const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark md:min-h-10";

/** A10 홈페이지 콘텐츠. `?tab=portfolio|news`, `?portfolio=<id>|new`, `?news=<id>|new` (편집기 열기). */
export function ContentWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const portfolios = useCollection("portfolios");
  const news = useCollection("news");
  const rawP = params.get("portfolio");
  const rawN = params.get("news");
  const tab = params.get("tab") === "news" || (rawN && !rawP) ? "news" : "portfolio";
  // 두 편집기 파라미터가 함께 오면 현재 탭의 편집기만 연다(두 대화상자가 겹치지 않게).
  const pParam = tab === "portfolio" ? rawP : null;
  const nParam = tab === "news" ? rawN : null;

  const go = (q: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    const merged = { tab: tab === "news" ? "news" : null, ...q };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  const close = () => router.replace(tab === "news" ? `${pathname}?tab=news` : pathname, { scroll: false });

  const pItem = pParam && pParam !== "new" ? portfolios.items.find(p => p.id === pParam) ?? null : null;
  const nItem = nParam && nParam !== "new" ? news.items.find(n => n.id === nParam) ?? null : null;
  const pMissing = !!pParam && pParam !== "new" && !portfolios.loading && !pItem;
  const nMissing = !!nParam && nParam !== "new" && !news.loading && !nItem;
  useEffect(() => {
    if (pMissing || nMissing) { toast.error("찾을 수 없는 항목이에요. 삭제되었을 수 있어요."); router.replace(tab === "news" ? `${pathname}?tab=news` : pathname, { scroll: false }); }
  }, [pMissing, nMissing, router, pathname, tab]);

  const tabs = [
    { label: `포트폴리오 ${portfolios.items.length}`, href: pathname, active: tab === "portfolio" },
    { label: `소식 ${news.items.length}`, href: `${pathname}?tab=news`, active: tab === "news" },
  ];
  const actions = tab === "portfolio"
    ? <button type="button" onClick={() => go({ tab: null, portfolio: "new" })} className={btn}><Plus className="size-4" aria-hidden />시공사례 등록</button>
    : <button type="button" onClick={() => go({ news: "new" })} className={btn}><Plus className="size-4" aria-hidden />소식 등록</button>;

  return (
    <>
      <PageHeader title="홈페이지 콘텐츠" description="홈페이지에 보이는 시공사례와 소식을 코드 없이 관리해요." actions={actions} tabs={tabs} />
      {tab === "portfolio"
        ? <PortfolioAdminList onEdit={p => go({ tab: null, portfolio: p.id })} onAdd={() => go({ tab: null, portfolio: "new" })} />
        : <NewsAdminList onEdit={n => go({ news: n.id })} onAdd={() => go({ news: "new" })} />}
      {pParam === "new" && <PortfolioEditor key="new" portfolio={null} onClose={close} />}
      {pItem && <PortfolioEditor key={pItem.id} portfolio={pItem} onClose={close} />}
      {nParam === "new" && <NewsEditor key="new" news={null} onClose={close} />}
      {nItem && <NewsEditor key={nItem.id} news={nItem} onClose={close} />}
    </>
  );
}
