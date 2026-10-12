import type { Portfolio } from "@/domain/types";
import { asset } from "@/lib/asset";

export function PortfolioCard({ item, onOpen }: { item: Portfolio; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="ink-card block w-full overflow-hidden text-left transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/3] border-b-2 border-ink bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(item.cover.url)} alt={item.title} loading="lazy" className="size-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full border-[1.5px] border-ink bg-white px-2 py-px text-[10px]">{item.signType}</span>
      </div>
      <div className="px-3 pb-3 pt-2.5 text-[11px] text-[#56645C]">
        <b className="mb-0.5 block truncate text-[13px] text-ink">{item.title}</b>
        {item.region} · {item.completedOn.slice(0, 7).replace("-", ".")}
      </div>
    </button>
  );
}
