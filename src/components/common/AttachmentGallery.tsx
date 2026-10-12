"use client";
import { useState } from "react";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { Attachment } from "@/domain/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export interface AttachmentGalleryProps {
  /** 첨부 목록 */
  items: Attachment[];
  /** 주면 각 항목에 삭제(×) 버튼이 생긴다 */
  onRemove?: (id: string) => void;
  /** 비었을 때 보여줄 글자(없으면 아무것도 그리지 않음) */
  emptyText?: string;
  className?: string;
}

const isImage = (a: Attachment) => a.mime.startsWith("image/");
const sizeText = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

/** 데이터 URL을 Blob URL로 바꿔 새 탭에서 연다(브라우저가 data: 주소로 새 탭 여는 것을 막기 때문). */
function openInNewTab(a: Attachment) {
  if (a.mime !== "application/pdf") { toast.error("이 파일 형식은 열 수 없어요"); return; }
  let url = asset(a.url);
  if (a.url.startsWith("data:")) {
    try {
      const [head, body] = a.url.split(",", 2);
      const bin = head.includes(";base64") ? atob(body) : decodeURIComponent(body);
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("파일을 열지 못했어요.");
      return;
    }
  }
  window.open(url, "_blank", "noopener");
}

/**
 * 첨부 목록: 이미지는 썸네일(누르면 확대 보기), PDF 등은 파일 카드(누르면 새 탭).
 * 썸네일 격자는 모바일 3열 · 태블릿 이상 4–6열.
 */
export function AttachmentGallery({ items, onRemove, emptyText, className }: AttachmentGalleryProps) {
  const [zoom, setZoom] = useState<Attachment | null>(null);

  if (items.length === 0) return emptyText ? <p className={cn("text-sm text-[#7A867F]", className)}>{emptyText}</p> : null;

  return (
    <>
      <ul className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6", className)}>
        {items.map(a => (
          <li key={a.id} className="group relative">
            <button
              type="button"
              onClick={() => (isImage(a) ? setZoom(a) : openInNewTab(a))}
              className="flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-[#E3E8E4] bg-[#F6F7F5] text-[#56645C] outline-none hover:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={isImage(a) ? `${a.name} 크게 보기` : `${a.name} 새 탭에서 열기`}
              title={a.name}
            >
              {isImage(a) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(a.url)} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <>
                  <FileText className="size-8 text-[#D64545]" aria-hidden />
                  <span className="mt-1 line-clamp-2 w-full break-all px-1.5 text-center text-[11px] leading-tight">{a.name}</span>
                  <span className="text-[10px] text-[#9AA59F]">{sizeText(a.size)}</span>
                </>
              )}
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="absolute -top-1.5 -right-1.5 inline-flex size-7 items-center justify-center rounded-full border border-[#E3E8E4] bg-white text-[#56645C] shadow-sm before:absolute before:-inset-2 before:content-[''] hover:text-danger"
                aria-label={`${a.name} 삭제`}
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={!!zoom} onOpenChange={o => { if (!o) setZoom(null); }}>
        <DialogContent className="max-w-[calc(100%-1rem)] gap-2 p-2 sm:max-w-4xl">
          <DialogTitle className="truncate px-1 pr-10 pt-1 text-sm">{zoom?.name}</DialogTitle>
          <DialogDescription className="sr-only">첨부 이미지 크게 보기</DialogDescription>
          {zoom && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(zoom.url)} alt={zoom.name} className="max-h-[80dvh] w-full rounded-md bg-[#F6F7F5] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
