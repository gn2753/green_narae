"use client";
import { useMemo, useState } from "react";
import { useSettings } from "@/data/hooks";
import type { Portfolio } from "@/domain/types";
import { cn } from "@/lib/utils";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioDialog } from "./PortfolioDialog";
import { SignTypeChips } from "./SignTypeChips";

/** items 는 이미 공개·정렬된 목록. 필터 후 limit 만큼 보여준다. */
export function PortfolioGrid({ items, limit, columns, loading, initialType }: { items: Portfolio[]; limit?: number; columns: "home" | "page"; loading?: boolean; initialType?: string | null }) {
  const settings = useSettings();
  const [type, setType] = useState<string | null>(initialType ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(() => {
    const f = type ? items.filter((p) => p.signType === type) : items;
    return limit ? f.slice(0, limit) : f;
  }, [items, type, limit]);
  const opened = items.find((p) => p.id === openId) ?? null;
  const cols = columns === "home" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div>
      <SignTypeChips types={settings?.signTypes ?? []} value={type} onChange={setType} />
      <div className={cn("grid gap-3.5", cols)}>
        {loading
          ? Array.from({ length: limit ?? 8 }, (_, i) => <div key={i} className="ink-card aspect-[4/3.6] animate-pulse bg-white/60" />)
          : shown.map((p) => <PortfolioCard key={p.id} item={p} onOpen={() => setOpenId(p.id)} />)}
      </div>
      {!loading && shown.length === 0 && <p className="py-10 text-center text-sm text-[#56645C]">해당 종류의 시공 사례가 아직 없습니다.</p>}
      <PortfolioDialog item={opened} open={opened !== null} onOpenChange={(o) => { if (!o) setOpenId(null); }} />
    </div>
  );
}
