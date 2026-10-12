"use client";
import { ArrowDown, ArrowUp, Star, X } from "lucide-react";
import type { Attachment } from "@/domain/types";
import { asset } from "@/lib/asset";

const iconBtn = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white text-[#1F2A24] hover:bg-[#F6F7F5] disabled:opacity-40 md:size-9";

/** 추가 이미지 목록: 순서 변경(위/아래)·삭제·대표로 지정. 순서는 갤러리에 보이는 순서와 같다. */
export function ImageOrderList({ items, onChange, onMakeCover, disabled }: {
  items: Attachment[];
  onChange: (next: Attachment[]) => void;
  onMakeCover: (index: number) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed border-[#D5DDD8] bg-white px-3 py-4 text-center text-sm text-[#56645C]">추가 이미지가 없어요. 상세 창의 갤러리에 함께 보여줄 사진을 더해보세요.</p>;
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ul className="space-y-2">
      {items.map((a, i) => (
        <li key={a.id} className="flex items-center gap-2 rounded-lg border border-[#E1E7E3] bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(a.url)} alt={`추가 이미지 ${i + 1}`} className="size-14 shrink-0 rounded-md bg-[#EEF1EF] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#56645C]">{i + 1}번째</p>
            <p className="truncate text-sm">{a.name}</p>
            <button type="button" onClick={() => onMakeCover(i)} disabled={disabled} className="mt-0.5 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#1E6E41] hover:underline disabled:opacity-40 md:min-h-8"><Star className="size-3.5" aria-hidden />대표로 지정</button>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" aria-label={`${i + 1}번째 이미지 위로`} disabled={disabled || i === 0} onClick={() => move(i, -1)} className={iconBtn}><ArrowUp className="size-4" aria-hidden /></button>
            <button type="button" aria-label={`${i + 1}번째 이미지 아래로`} disabled={disabled || i === items.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ArrowDown className="size-4" aria-hidden /></button>
            <button type="button" aria-label={`${i + 1}번째 이미지 삭제`} disabled={disabled} onClick={() => onChange(items.filter((_, k) => k !== i))} className={iconBtn}><X className="size-4" aria-hidden /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}
