"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "./useIsMobile";

export interface ResponsiveDialogProps {
  /** 열림 여부(제어 컴포넌트) */
  open: boolean;
  /** 닫기(바깥 클릭·Esc·X 포함) 요청 시 호출 */
  onOpenChange: (open: boolean) => void;
  /** 제목(필수, 스크린리더에도 쓰인다) */
  title: ReactNode;
  /** 제목 아래 짧은 설명 */
  description?: ReactNode;
  /** 하단 고정 버튼 영역(예: 취소·저장). 모바일에서는 화면 아래에 붙는다. */
  footer?: ReactNode;
  /** 데스크톱 폭: sm 384px · md 512px(기본) · lg 672px · xl 896px */
  size?: "sm" | "md" | "lg" | "xl";
  /** 본문 영역에 덧붙일 클래스 */
  className?: string;
  children?: ReactNode;
}

/** 44px 터치 영역의 닫기 버튼 */
const closeCls = "absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

const WIDTH = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" } as const;

/**
 * 반응형 모달: ≥768px는 가운데 Dialog, <768px는 아래에서 올라오는 시트(최대 높이 92dvh, 본문 스크롤).
 * 본문이 길어도 제목과 footer는 고정된다.
 * 모양(시트/Dialog)은 열리는 순간 정해지고 열려 있는 동안은 바뀌지 않는다
 * (휴대폰 회전 등으로 768px를 넘나들어도 children이 다시 마운트되지 않아 입력 중인 값이 유지된다).
 */
export function ResponsiveDialog({ open, onOpenChange, title, description, footer, size = "md", className, children }: ResponsiveDialogProps) {
  const isMobileNow = useIsMobile();
  // 닫혀 있을 때만 현재 폭을 따라간다(렌더 중 상태 조정 패턴). 열려 있으면 연 순간의 모양을 유지.
  const [isMobile, setIsMobile] = useState(isMobileNow);
  if (!open && isMobile !== isMobileNow) setIsMobile(isMobileNow);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] gap-0 rounded-t-2xl p-0">
          <SheetClose className={closeCls} aria-label="닫기"><XIcon className="size-5" /></SheetClose>
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3 pr-14">
            <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", className)}>{children}</div>
          {footer && (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [&>*]:h-11 [&>*]:w-full">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn("flex max-h-[88dvh] flex-col gap-0 p-0", WIDTH[size])}>
        <DialogClose className={closeCls} aria-label="닫기"><XIcon className="size-5" /></DialogClose>
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-3 pr-14">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}>{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 rounded-b-xl border-t bg-muted/40 px-5 py-3 [&>*]:h-10">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
