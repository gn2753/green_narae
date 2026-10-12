"use client";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";

const OPTIONS = [
  { id: "ics", name: "ICS 구독 주소", points: ["간단하게 연결", "단방향(Google 달력에서 보기만)", "Google 로그인 불필요"], recommended: true },
  { id: "api", name: "Google Calendar API", points: ["양방향 동기화", "Google 로그인(OAuth) 필요", "설정과 심사 과정이 더 복잡"], recommended: false },
];

export function GoogleCalendarCard() {
  return (
    <section aria-labelledby="gcal" className="rounded-xl border border-[#E3E8E4] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CalendarDays className="size-4 text-[#2F8F57]" aria-hidden />
        <h2 id="gcal" className="text-sm font-bold text-[#1F2A24]">Google 달력 연동</h2>
        <StatusBadge tone="yellow">연동 방식 결정 필요</StatusBadge>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {OPTIONS.map(o => (
          <div key={o.id} className={`rounded-lg border p-3 ${o.recommended ? "border-[#2F8F57] bg-[#F1F9F4]" : "border-[#E3E8E4]"}`}>
            <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-[#1F2A24]">{o.name}{o.recommended && <StatusBadge tone="green">권장</StatusBadge>}</p>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-[#5F6B64]">{o.points.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#5F6B64]">먼저 ICS 구독으로 시작하고, 필요해지면 API로 넓히는 것을 권장합니다.</p>
      <Button className="mt-3 min-h-11 md:min-h-9" onClick={() => toast("2차 연동 예정입니다")}>연동하기</Button>
    </section>
  );
}
