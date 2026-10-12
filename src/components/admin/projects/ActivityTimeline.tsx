"use client";
import { useMemo, useState } from "react";
import { ArrowRightLeft, CircleDollarSign, FilePlus2, Globe, Hourglass, ListChecks, LoaderCircle, MessageSquareText, Paperclip, Pencil, type LucideIcon } from "lucide-react";
import { useAdmin, useCollection, useMutation, useRepo } from "@/data/hooks";
import type { ActivityType } from "@/domain/types";
import { addProjectNote } from "@/services/projectService";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeKo } from "@/lib/format";

const ICON: Record<ActivityType, LucideIcon> = {
  create: FilePlus2, stage: ArrowRightLeft, waiting: Hourglass, task: ListChecks, attach: Paperclip, note: MessageSquareText, edit: Pencil, money: CircleDollarSign,
};

/** 의뢰 활동 기록(최신순) + 메모 입력. */
export function ActivityTimeline({ projectId }: { projectId: string }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const { items, loading } = useCollection("activities");
  const [text, setText] = useState("");
  const list = useMemo(() => items.filter(a => a.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items, projectId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || busy || !text.trim()) return;
    const ok = await run(() => addProjectNote(repo, projectId, text, admin.id), "메모를 남겼어요", { exclusive: true });
    if (ok) setText("");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor={`note-${projectId}`} className="sr-only">활동 메모</label>
        <Textarea id={`note-${projectId}`} value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="통화 내용, 고객 요청 등 메모를 남기세요" className="min-h-16 bg-white" disabled={busy}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button type="submit" disabled={busy || !admin || !text.trim()} className="inline-flex min-h-11 items-center justify-center gap-1.5 self-end rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50 md:min-h-9">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}메모 추가
        </button>
      </form>
      {loading ? <p className="text-sm text-[#7A867F]">불러오는 중…</p> : list.length === 0 ? <p className="text-sm text-[#7A867F]">활동 기록이 없어요.</p> : (
        <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-[#E3E8E4]" aria-label="활동 기록">
          {list.map(a => {
            const Icon = ICON[a.type] ?? Pencil;
            return (
              <li key={a.id} className="relative flex gap-2.5">
                <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#56645C] ring-1 ring-[#DDE3DF]"><Icon className="size-3.5" aria-hidden /></span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={a.type === "note" ? "rounded-lg bg-[#FFF9E8] px-2.5 py-1.5 text-sm break-words whitespace-pre-wrap text-[#1F2A24]" : "text-sm break-words text-[#1F2A24]"}>{a.message}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#7A867F]">
                    {a.actorId === "web" ? <span className="inline-flex items-center gap-1"><Globe className="size-3" aria-hidden />홈페이지</span> : <AdminAvatar id={a.actorId} size="xs" withName />}
                    <span>{formatDateTimeKo(a.createdAt)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
