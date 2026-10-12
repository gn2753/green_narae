"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRepo } from "@/data/DataProvider";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DemoBanner({ variant = "site" }: { variant?: "site" | "admin" }) {
  const repo = useRepo();
  const [open, setOpen] = useState(false);

  const doReset = () => {
    repo.reset();
    setOpen(false);
    toast.success("데모 데이터를 처음 상태로 되돌렸어요");
  };

  return (
    <div
      className={cn("flex h-8 items-center justify-between gap-2 px-3 text-[11px] text-[#5b4600] md:px-6 md:text-xs", variant === "admin" && "border-b border-[#e6cf86]")}
      style={{ backgroundColor: "#FFE9A8" }}
      role="region"
      aria-label="데모 안내"
    >
      <span className="min-w-0 truncate">
        시안용 데모<span className="hidden sm:inline"> · 입력 내용은 이 브라우저에만 저장됩니다</span>
      </span>
      <span className="flex shrink-0 items-center">{/* 띠 높이는 32px 그대로, ::after로 누르는 영역을 위아래 6px씩 넓혀 44px 확보 */}
        <Link href="/review" className="relative z-10 inline-flex h-8 items-center px-2.5 font-bold underline underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']">기능 안내</Link>
        <button type="button" onClick={() => setOpen(true)} className="relative z-10 inline-flex h-8 items-center px-2.5 font-bold underline underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']">
          초기화
        </button>
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데모 데이터를 초기화할까요?</DialogTitle>
            <DialogDescription>
              지금까지 입력·수정한 내용이 모두 지워지고 처음 샘플 상태로 돌아갑니다. 이 브라우저에만 적용돼요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setOpen(false)}>취소</Button>
            <Button className="h-11" onClick={doReset}>초기화</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
