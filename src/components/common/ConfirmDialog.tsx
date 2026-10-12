"use client";
import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  /** 열림 여부(제어 컴포넌트) */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 질문(예: "이 업무를 삭제할까요?") */
  title: ReactNode;
  /** 결과 설명(예: "삭제하면 되돌릴 수 없어요.") */
  description?: ReactNode;
  /** 확인 버튼 글자(예: "삭제") */
  confirmLabel: string;
  /** 취소 버튼 글자(기본 "취소") */
  cancelLabel?: string;
  /**
   * 확인 시 실행. Promise를 돌려주면 끝날 때까지 버튼이 비활성·스피너가 되고,
   * 끝나면 자동으로 닫힌다(결과가 `false`면 닫지 않음 — 실패 시 그대로 두고 싶을 때).
   */
  onConfirm: () => void | boolean | Promise<unknown>;
  /** 삭제처럼 되돌릴 수 없는 동작이면 빨간 버튼 */
  danger?: boolean;
}

/** 확인 질문 모달(삭제·초기화·상태 되돌리기 등). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = "취소", onConfirm, danger }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await onConfirm();
      if (r !== false) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!busy) onOpenChange(o); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold leading-snug">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="h-11 sm:h-10" disabled={busy} onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button
            className={cn("h-11 sm:h-10", danger ? "bg-danger text-white hover:bg-danger/90" : "bg-brand text-white hover:bg-brand-dark")}
            disabled={busy}
            onClick={confirm}
          >
            {busy && <LoaderCircle className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
