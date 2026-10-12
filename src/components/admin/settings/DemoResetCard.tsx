"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRepo } from "@/data/DataProvider";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cardCls } from "./settingsUi";

export function DemoResetCard() {
  const repo = useRepo();
  const [open, setOpen] = useState(false);
  return (
    <section className={cardCls}>
      <h2 className="text-sm font-bold">데모 데이터 초기화</h2>
      <p className="mb-3 text-sm text-[#56645C]">이 브라우저에 입력한 모든 내용을 지우고 처음 예시 데이터로 되돌려요. 먼저 백업을 내려받아 두면 안전해요.</p>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#E7B9AD] bg-white px-4 text-sm font-bold text-[#B3402A] hover:bg-[#FDF3F0] md:min-h-10"><RotateCcw className="size-4" aria-hidden />데모 데이터 초기화</button>
      <ConfirmDialog open={open} onOpenChange={setOpen} danger title="데모 데이터를 처음 상태로 되돌릴까요?" description="입력한 고객·의뢰·업무·설정이 모두 사라지고 예시 데이터로 바뀌어요. 되돌릴 수 없어요."
        confirmLabel="초기화" onConfirm={async () => { await repo.reset(); toast.success("데모 데이터를 처음 상태로 되돌렸어요"); }} />
    </section>
  );
}
