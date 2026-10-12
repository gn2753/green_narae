"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsRulesNote({ excludedCount }: { excludedCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-4 rounded-xl border border-[#E3E8E4] bg-white">
      <button type="button" aria-expanded={open} aria-controls="stats-rules" onClick={() => setOpen(o => !o)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-bold md:px-4">
        숫자는 이렇게 세요
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul id="stats-rules" className="list-disc space-y-1 px-8 pb-3 text-sm text-[#3B4A41] md:pb-4">
          <li>같은 방문자는 하루에 한 번만 셉니다. 주간·전체 숫자는 중복 없는 방문자 수예요.</li>
          <li>관리자(두 대표) 방문과 검색봇·자동화 접속은 뺍니다. 지금 제외된 관리자 방문 기록은 {excludedCount}건이에요.</li>
          <li>이름·연락처 같은 개인정보는 저장하지 않고, 브라우저에 임의로 만든 익명 번호만 사용합니다.</li>
          <li>문의 전환율은 방문 중 &lsquo;문의 완료&rsquo; 페이지까지 간 비율입니다.</li>
          <li>1차 시안의 숫자는 예시 데이터이고, 실제 수집은 2차에서 연결됩니다.</li>
        </ul>
      )}
    </section>
  );
}
