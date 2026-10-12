"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Portfolio } from "@/domain/types";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function PortfolioDialog({ item, open, onOpenChange }: { item: Portfolio | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  // 닫히는 동안(item === null) 마지막 항목을 계속 그려 빈 화면이 번쩍이지 않게 한다.
  const [last, setLast] = useState<Portfolio | null>(item);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 content-start gap-0 overflow-y-auto rounded-none border-2 border-ink bg-cream p-0 sm:max-w-none",
          "md:top-1/2 md:left-1/2 md:h-auto md:max-h-[92dvh] md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-[6px_6px_0_var(--color-ink)] md:sm:max-w-3xl",
        )}
      >
        {shown && <DialogBody key={shown.id} item={shown} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ item }: { item: Portfolio }) {
  const images = [item.cover, ...item.images];
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const go = useCallback((d: number) => setIdx((i) => (i + d + total) % total), [total]);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && (t.closest("input, textarea, select") || (t instanceof HTMLElement && t.isContentEditable))) return;
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const rows: [string, string][] = [
    ["간판 종류", item.signType],
    ["지역", item.region],
    ["시공일", item.completedOn.replaceAll("-", ".")],
    ["거래처", item.clientDisplayName],
  ];

  return (
    <div className="pr-0">
      <div
        className="relative aspect-[4/3] touch-pan-y select-none border-b-2 border-ink bg-white md:aspect-[16/10]"
        onPointerDown={(e) => {
          if (e.target instanceof Element && e.target.closest("button")) return;
          startX.current = e.clientX;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (dx > 40) go(-1);
          else if (dx < -40) go(1);
        }}
        onPointerCancel={() => { startX.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(images[idx].url)} alt={`${item.title} ${idx + 1}`} draggable={false} className="size-full object-contain" />
        {total > 1 && (
          <>
            <button type="button" aria-label="이전 사진" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_var(--color-ink)]"><ChevronLeft className="size-5" /></button>
            <button type="button" aria-label="다음 사진" onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_var(--color-ink)]"><ChevronRight className="size-5" /></button>
          </>
        )}
        <DialogClose aria-label="닫기" className="absolute right-2 top-2 grid size-11 place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_var(--color-ink)]"><X className="size-5" /></DialogClose>
        <span className="absolute bottom-2 right-2 rounded-full border-[1.5px] border-ink bg-white px-2.5 py-0.5 text-xs" aria-live="polite">{idx + 1} / {total}</span>
      </div>
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b-2 border-ink bg-white p-2">
          {images.map((im, i) => (
            <button key={im.id + i} type="button" aria-label={`${i + 1}번 사진 보기`} aria-current={i === idx} onClick={() => setIdx(i)} className={cn("h-14 w-[74px] shrink-0 overflow-hidden rounded-lg border-2", i === idx ? "border-brand ring-2 ring-brand/40" : "border-ink/30")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(im.url)} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <DialogTitle className="font-jua text-2xl font-normal leading-tight text-ink">{item.title}</DialogTitle>
          <DialogDescription className="sr-only">시공 사례 상세 사진과 정보</DialogDescription>
        </div>
        <dl className="overflow-hidden rounded-xl border-2 border-ink bg-white text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex border-b border-ink/20 last:border-b-0">
              <dt className="w-24 shrink-0 bg-cream px-3 py-2 font-bold">{k}</dt>
              <dd className="px-3 py-2">{v}</dd>
            </div>
          ))}
        </dl>
        {item.description && <p className="whitespace-pre-line text-sm leading-relaxed">{item.description}</p>}
        <Link href="/contact" className="ink-btn flex min-h-11 items-center justify-center bg-brand px-5 text-sm text-white">이런 간판 문의하기</Link>
      </div>
    </div>
  );
}
