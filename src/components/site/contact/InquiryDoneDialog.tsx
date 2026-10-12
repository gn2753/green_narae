"use client";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Inquiry } from "@/domain/types";

export function InquiryDoneDialog({ inquiry, open, onOpenChange }: { inquiry: Inquiry | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="size-12 text-brand" aria-hidden />
          <DialogTitle className="font-jua text-2xl font-normal">문의가 접수되었어요</DialogTitle>
          <DialogDescription>영업일 기준 1일 안에 연락드립니다.</DialogDescription>
        </div>
        {inquiry && (
          <dl className="overflow-hidden rounded-xl border-2 border-ink text-[13px]">
            {([["이름", inquiry.name], ["연락처", inquiry.phone], ["이메일", inquiry.email ?? ""], ["문의 내용", inquiry.message]] as const).map(([k, v]) => (
              <div key={k} className="flex border-b border-ink/20 last:border-b-0">
                <dt className="w-20 shrink-0 bg-cream px-3 py-2 font-bold">{k}</dt>
                <dd className="min-w-0 whitespace-pre-line break-words px-3 py-2">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <button type="button" onClick={() => onOpenChange(false)} className="ink-btn min-h-11 w-full bg-brand text-white">확인</button>
      </DialogContent>
    </Dialog>
  );
}
