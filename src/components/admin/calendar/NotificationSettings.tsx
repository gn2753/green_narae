"use client";
import { useState, type ReactNode } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useRepo } from "@/data/DataProvider";
import { useMutation } from "@/data/hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ADMINS, ADMIN_IDS } from "@/domain/defaults";
import type { Settings, SummaryItem } from "@/domain/types";

type Notifications = Settings["notifications"];
const ITEMS: { id: SummaryItem; label: string }[] = [
  { id: "today", label: "오늘 업무" }, { id: "overdue", label: "지연" }, { id: "inquiries", label: "미답변 문의" }, { id: "payments", label: "입금 예정" },
];
export interface SummaryCounts { today: number; overdue: number; inquiries: number; payments: number }

/** 요약 미리보기 문구 (선택된 항목만, 정해진 순서). */
export function summaryText(items: SummaryItem[], c: SummaryCounts): string {
  const parts: Record<SummaryItem, string> = { today: `오늘 업무 ${c.today}건`, overdue: `지연 ${c.overdue}건`, inquiries: `미답변 문의 ${c.inquiries}건`, payments: `이번 주 입금 예정 ${c.payments}건` };
  const text = ITEMS.filter(i => items.includes(i.id)).map(i => parts[i.id]).join(" · ");
  return text || "포함할 항목을 선택해 주세요";
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-2">
      <div className="min-w-0"><p className="text-sm font-medium text-[#1F2A24]">{label}</p>{hint && <p className="text-xs text-[#7A867F]">{hint}</p>}</div>
      {children}
    </div>
  );
}

const toggle = <T,>(list: T[], v: T, on: boolean): T[] => (on ? [...list, v] : list.filter(x => x !== v));

export function NotificationSettings({ settings, counts }: { settings: Settings; counts: SummaryCounts }) {
  const repo = useRepo();
  const { run, busy } = useMutation();
  const n = settings.notifications;
  const [draft, setDraft] = useState<Notifications>(n);
  const d = draft.dailySummary;
  const setDaily = (patch: Partial<Notifications["dailySummary"]>) => setDraft({ ...draft, dailySummary: { ...d, ...patch } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(n);
  const invalid = d.enabled && (d.recipients.length === 0 || d.items.length === 0 || !/^\d{2}:\d{2}$/.test(d.time));

  const save = async () => {
    const next: Notifications = { dailySummary: { ...d, recipients: [...d.recipients], items: [...d.items] }, newInquiry: draft.newInquiry };
    await run(() => repo.updateSettings({ notifications: next }), "알림 설정을 저장했어요");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <section aria-labelledby="noti" className="rounded-xl border border-[#E3E8E4] bg-white p-4">
        <h2 id="noti" className="mb-1 text-sm font-bold text-[#1F2A24]">알림 설정</h2>
        <div className="divide-y divide-[#EEF1EF]">
          <Row label="매일 요약 알림" hint="정해진 시각에 하루 요약을 보내요"><Switch checked={d.enabled} onCheckedChange={v => setDaily({ enabled: v })} aria-label="매일 요약 알림" /></Row>
          <Row label="보내는 시간">
            <Input type="time" value={d.time} onChange={e => setDaily({ time: e.target.value })} disabled={!d.enabled} className="h-11 w-32 md:h-9" aria-label="보내는 시간" />
          </Row>
          <div className="py-3">
            <p className="mb-1 text-sm font-medium text-[#1F2A24]">받는 사람</p>
            <div className="flex flex-wrap gap-x-5">
              {ADMIN_IDS.map(id => (
                <label key={id} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={d.recipients.includes(id)} disabled={!d.enabled} onCheckedChange={v => setDaily({ recipients: toggle(d.recipients, id, !!v) })} />{ADMINS[id].name}</label>
              ))}
            </div>
          </div>
          <div className="py-3">
            <p className="mb-1 text-sm font-medium text-[#1F2A24]">포함 항목</p>
            <div className="flex flex-wrap gap-x-5">
              {ITEMS.map(i => (
                <label key={i.id} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={d.items.includes(i.id)} disabled={!d.enabled} onCheckedChange={v => setDaily({ items: toggle(d.items, i.id, !!v) })} />{i.label}</label>
              ))}
            </div>
          </div>
          <Row label="새 문의 즉시 알림" hint="홈페이지로 문의가 들어오면 바로 알려요"><Switch checked={draft.newInquiry} onCheckedChange={v => setDraft({ ...draft, newInquiry: v })} aria-label="새 문의 즉시 알림" /></Row>
        </div>
        {invalid && <p className="mt-2 text-xs text-[#D64545]" role="alert">받는 사람과 포함 항목을 하나 이상 선택하고 시간을 입력해 주세요.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="min-h-11 md:min-h-9" onClick={save} disabled={busy || !dirty || invalid}>{busy ? "저장 중…" : "저장"}</Button>
          <Button variant="outline" className="min-h-11 md:min-h-9" onClick={() => toast("휴대폰 알림은 2차(Firebase)에 연결됩니다")}><Smartphone className="size-4" aria-hidden />휴대폰 등록</Button>
        </div>
      </section>
      <section aria-labelledby="preview" className="h-fit rounded-xl border border-[#E3E8E4] bg-white p-4">
        <h2 id="preview" className="mb-2 text-sm font-bold text-[#1F2A24]">요약 미리보기</h2>
        <div className="rounded-lg bg-[#1F2A24] p-3 text-white">
          <p className="mb-1 text-xs text-[#9FB3A7]">그린나래디자인 · 오전 {d.time}</p>
          <p className="text-sm leading-relaxed">{summaryText(d.items, counts)}</p>
        </div>
        <p className="mt-2 text-xs text-[#7A867F]">오늘 데이터 기준 예시입니다.</p>
      </section>
    </div>
  );
}
