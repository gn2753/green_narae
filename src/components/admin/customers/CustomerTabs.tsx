"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, History, ListChecks, LoaderCircle, Plus, Wallet } from "lucide-react";
import { useAdmin, useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { customerTimeline, type TimelineKind } from "@/domain/customers";
import { CONTRACT_STATUS_LABEL, DEFAULT_SETTINGS, PAYMENT_KIND_LABEL, REPLY_CHANNEL_LABEL, SOURCE_LABEL, TASK_STATUS_LABEL, categoryLabel, stageLabel } from "@/domain/defaults";
import { activePayments, paymentStatus, receivables } from "@/domain/money";
import { addConsultNote } from "@/services/customerService";
import type { Customer, Task } from "@/domain/types";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import { ProjectDetail } from "@/components/admin/projects/ProjectDetail";
import { TaskDialog } from "@/components/admin/tasks/TaskDialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateKo, formatDateTimeKo, formatWon } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "work", label: "의뢰·업무" },
  { key: "contracts", label: "견적·계약" },
  { key: "payments", label: "입금 내역" },
  { key: "history", label: "문의·상담 이력" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const isTab = (v: string | null): v is TabKey => TABS.some(t => t.key === v);

const CONTRACT_TONE: Record<string, StatusTone> = { draft: "gray", sent: "yellow", signed: "green", cancelled: "red" };
const KIND_ICON: Record<TimelineKind, string> = { inquiry: "문의", reply: "답변", activity: "의뢰", memo: "메모" };
const KIND_TONE: Record<TimelineKind, StatusTone> = { inquiry: "red", reply: "green", activity: "blue", memo: "yellow" };

/** 고객 상세 탭 4개. 탭은 `?tab=`으로 유지된다. */
export function CustomerTabs({ customer: c, tab, onTab }: { customer: Customer; tab: string | null; onTab: (t: string) => void }) {
  const active: TabKey = isTab(tab) ? tab : "work";
  return (
    <div>
      <div role="tablist" aria-label="고객 정보 탭" className="flex gap-1 overflow-x-auto border-b border-[#E3E8E4]">
        {TABS.map(t => (
          <button key={t.key} id={`ctab-${t.key}`} type="button" role="tab" aria-selected={active === t.key} aria-controls="ctab-panel" onClick={() => onTab(t.key)}
            className={cn("min-h-11 flex-1 shrink-0 border-b-2 px-1.5 text-[13px] whitespace-nowrap sm:flex-none sm:px-3 sm:text-sm", active === t.key ? "border-brand font-bold text-brand" : "border-transparent text-[#56645C] hover:text-[#1F2A24]")}>{t.label}</button>
        ))}
      </div>
      <div id="ctab-panel" role="tabpanel" aria-labelledby={`ctab-${active}`} className="pt-4">
        {active === "work" && <WorkTab customer={c} />}
        {active === "contracts" && <ContractsTab customer={c} />}
        {active === "payments" && <PaymentsTab customer={c} />}
        {active === "history" && <HistoryTab customer={c} />}
      </div>
    </div>
  );
}

const card = "rounded-xl border border-[#E3E8E4] bg-white";

function WorkTab({ customer: c }: { customer: Customer }) {
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const { items: projects, loading } = useCollection("projects");
  const { items: tasks } = useCollection("tasks");
  const [openId, setOpenId] = useState<string | null>(null);
  const [taskFor, setTaskFor] = useState<{ projectId: string } | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const mine = useMemo(() => projects.filter(p => p.customerId === c.id).sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) || b.createdAt.localeCompare(a.createdAt)), [projects, c.id]);
  const ids = new Set(mine.map(p => p.id));
  const myTasks = tasks.filter(t => t.customerId === c.id || (t.projectId && ids.has(t.projectId))).sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.dueDate.localeCompare(b.dueDate));
  const titleOf = (id: string | null) => mine.find(p => p.id === id)?.title;

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E9EEEA]" aria-busy="true" />;
  return (
    <div className="space-y-6">
      <section aria-label="의뢰 목록">
        <h3 className="mb-2 text-sm font-bold">의뢰 {mine.length}건</h3>
        {mine.length === 0 ? <EmptyState icon={ListChecks} title="진행한 의뢰가 없어요" description="문의에서 의뢰를 시작하면 여기에 보여요." /> : (
          <ul className={cn(card, "divide-y divide-[#EEF1EF]")}>
            {mine.map(p => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
                <button type="button" onClick={() => setOpenId(p.id)} className="min-h-11 min-w-0 flex-1 text-left" aria-label={`${p.title} 상세 열기`}>
                  <span className="block truncate font-bold">{p.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#56645C]">
                    <span>{p.signType}</span>
                    <StatusBadge tone={p.status === "active" ? "blue" : p.status === "done" ? "green" : "gray"}>{p.status === "active" ? stageLabel(settings, p.stage) : p.status === "done" ? "완료" : "종료"}</StatusBadge>
                    {p.dueDate && <span>마감 {formatDateKo(p.dueDate)}</span>}
                  </span>
                </button>
                <button type="button" onClick={() => setTaskFor({ projectId: p.id })} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-medium hover:bg-[#F6F7F5] md:min-h-9"><Plus className="size-4" aria-hidden />업무 추가</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="연결 업무">
        <h3 className="mb-2 text-sm font-bold">연결 업무 {myTasks.length}건</h3>
        {myTasks.length === 0 ? <p className="rounded-xl border border-dashed border-[#D5DDD8] px-4 py-6 text-center text-sm text-[#7A867F]">연결된 업무가 없어요.</p> : (
          <ul className={cn(card, "divide-y divide-[#EEF1EF]")}>
            {myTasks.map(t => (
              <li key={t.id}>
                <button type="button" onClick={() => setEditTask(t)} className="block min-h-11 w-full px-4 py-2 text-left hover:bg-[#F6F7F5]">
                  <span className={cn("block truncate font-medium", t.status === "done" && "text-[#9AA59F] line-through")}>{t.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[#56645C]">
                    <span>{categoryLabel(settings, t.category)}</span><span>{TASK_STATUS_LABEL[t.status]}</span><span>마감 {formatDateKo(t.dueDate)}</span>
                    {titleOf(t.projectId) && <span className="truncate">{titleOf(t.projectId)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {openId && <ProjectDetail projectId={openId} onClose={() => setOpenId(null)} />}
      <TaskDialog open={!!taskFor} defaultProjectId={taskFor?.projectId ?? null} lockProject onOpenChange={o => { if (!o) setTaskFor(null); }} />
      <TaskDialog open={!!editTask} task={editTask} onOpenChange={o => { if (!o) setEditTask(null); }} />
    </div>
  );
}

function ContractsTab({ customer: c }: { customer: Customer }) {
  const { items, loading } = useCollection("contracts");
  const { items: projects } = useCollection("projects");
  const mine = items.filter(k => k.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E9EEEA]" aria-busy="true" />;
  if (!mine.length) return <EmptyState icon={FileText} title="견적·계약이 없어요" description="견적·계약 관리에서 등록하면 여기에 보여요." />;
  return (
    <ul className={cn(card, "divide-y divide-[#EEF1EF]")}>
      {mine.map(k => (
        <li key={k.id}>
          <Link href={`/admin/contracts?id=${k.id}`} className="block min-h-11 px-4 py-3 hover:bg-[#F6F7F5]">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{projects.find(p => p.id === k.projectId)?.title ?? "의뢰 미연결"}</span>
              <StatusBadge tone={CONTRACT_TONE[k.status]}>{CONTRACT_STATUS_LABEL[k.status]}</StatusBadge>
            </span>
            <span className="mt-1 flex flex-wrap gap-x-4 text-sm text-[#56645C]">
              <span>견적 {formatWon(k.quoteAmount)}</span>
              {k.contractAmount !== undefined && <span>계약 {formatWon(k.contractAmount)}</span>}
              {k.signedOn && <span>계약일 {formatDateKo(k.signedOn)}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PaymentsTab({ customer: c }: { customer: Customer }) {
  const today = useToday();
  const { items: allPayments, loading } = useCollection("payments");
  const { items: contracts } = useCollection("contracts");
  const items = activePayments(allPayments, contracts);
  const { items: projects } = useCollection("projects");
  const mine = items.filter(p => p.customerId === c.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E9EEEA]" aria-busy="true" />;
  if (!mine.length) return <EmptyState icon={Wallet} title="입금 내역이 없어요" description="계약이 완료되면 계약금·잔금 예정이 생겨요." />;
  const paid = mine.filter(p => p.paidOn).reduce((s, p) => s + p.amount, 0);
  const r = receivables(mine, today);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[{ l: "입금 합계", v: paid, c: "" }, { l: "미수금", v: r.overdueAmount, c: r.overdueAmount > 0 ? "text-[#B42323]" : "" }, { l: "입금 예정", v: r.outstandingAmount - r.overdueAmount, c: "" }].map(s => (
          <div key={s.l} className={cn(card, "px-2 py-3")}><div className="text-xs text-[#56645C]">{s.l}</div><div className={cn("mt-0.5 text-sm font-bold md:text-base", s.c)}>{formatWon(s.v)}</div></div>
        ))}
      </div>
      <ul className={cn(card, "divide-y divide-[#EEF1EF]")}>
        {mine.map(p => {
          const st = paymentStatus(p, today);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{PAYMENT_KIND_LABEL[p.kind]} <span className="font-medium text-[#56645C]">{formatWon(p.amount)}</span></div>
                <div className="truncate text-xs text-[#56645C]">{projects.find(x => x.id === p.projectId)?.title ?? "의뢰 미연결"} · {p.paidOn ? `${formatDateKo(p.paidOn)} 입금` : `${formatDateKo(p.dueDate)} 예정`}</div>
              </div>
              <StatusBadge tone={st === "paid" ? "green" : st === "overdue" ? "red" : "yellow"} dot>{st === "paid" ? "입금완료" : st === "overdue" ? "연체" : "입금 예정"}</StatusBadge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HistoryTab({ customer: c }: { customer: Customer }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const inquiries = useCollection("inquiries"), projects = useCollection("projects"), activities = useCollection("activities");
  const [text, setText] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo(() => customerTimeline(c, { inquiries: inquiries.items, projects: projects.items, activities: activities.items }, {
    source: q => SOURCE_LABEL[q.source], channel: r => REPLY_CHANNEL_LABEL[r.channel],
  }), [c, inquiries.items, projects.items, activities.items]);
  const target = projects.items.filter(p => p.customerId === c.id && p.status === "active").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const loading = inquiries.loading || projects.loading || activities.loading;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin || !text.trim()) return;
    const r = await run(() => addConsultNote(repo, c.id, text, admin.id), "상담 메모를 추가했어요", { exclusive: true });
    if (r) setText("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className={cn(card, "space-y-2 p-4")}>
        <label htmlFor="consult-note" className="text-sm font-bold">상담 메모 추가</label>
        <Textarea id="consult-note" className="min-h-20 bg-white" value={text} maxLength={1000} disabled={busy} onChange={e => setText(e.target.value)}
          placeholder="전화·방문으로 나눈 이야기를 적어두세요." />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#7A867F]">{target ? `진행 중인 의뢰 ‘${target.title}’의 활동 기록에 남아요.` : "진행 중인 의뢰가 없어 고객 메모에 날짜와 함께 붙어요."}</p>
          <button type="submit" disabled={busy || !admin || !text.trim()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60 md:min-h-10">
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}추가
          </button>
        </div>
      </form>
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-[#E9EEEA]" aria-busy="true" /> : items.length === 0 ? (
        <EmptyState icon={History} title="문의·상담 이력이 없어요" description="문의, 답변, 의뢰 활동, 상담 메모가 시간순으로 모여요." />
      ) : (
        <ol className={cn(card, "divide-y divide-[#EEF1EF]")} aria-label="문의·상담 이력">
          {items.map(e => (
            <li key={e.id} className="flex gap-3 px-4 py-3">
              <StatusBadge tone={KIND_TONE[e.kind]} className="h-fit shrink-0">{KIND_ICON[e.kind]}</StatusBadge>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-[#56645C]">
                  {e.projectId ? <button type="button" onClick={() => setOpenId(e.projectId!)} className="font-bold text-brand hover:underline">{e.title}</button> : <span className="font-bold">{e.title}</span>}
                  <span>{e.kind === "memo" ? formatDateKo(e.at.slice(0, 10)) : formatDateTimeKo(e.at)}</span>
                </div>
                <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{e.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {openId && <ProjectDetail projectId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
