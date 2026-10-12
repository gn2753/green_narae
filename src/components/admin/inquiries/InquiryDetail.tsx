"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, CircleCheck, FolderKanban, Link2, UserCheck } from "lucide-react";
import { useAdmin, useCollection, useMutation, useRepo } from "@/data/hooks";
import { ADMINS, ADMIN_IDS, INQUIRY_STATUS_LABEL, REPLY_CHANNEL_LABEL, SOURCE_LABEL } from "@/domain/defaults";
import { findCustomerByPhone } from "@/domain/inquiries";
import type { AdminId, Inquiry } from "@/domain/types";
import { assignInquiry, closeInquiry, markInquirySeen } from "@/services/inquiryService";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { formatDateTimeKo, formatPhone } from "@/lib/format";
import { ReplyForm } from "./ReplyForm";
import { StartProjectDialog } from "./StartProjectDialog";
import { SOURCE_ICON } from "./InquiryList";

const ASSIGNEES = [{ value: "", label: "미지정" }, ...ADMIN_IDS.map(id => ({ value: id, label: ADMINS[id].name }))];

/** 문의 상세. 열면 NEW 표시가 사라진다. `onBack`을 주면(모바일) 목록으로 돌아가는 버튼을 보인다. */
export function InquiryDetail({ inquiry, onBack }: { inquiry: Inquiry; onBack?: () => void }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { items: customers } = useCollection("customers");
  const { run, busy } = useMutation();
  const [startOpen, setStartOpen] = useState(false);
  const [presetCustomer, setPresetCustomer] = useState<string | undefined>();
  const [closeOpen, setCloseOpen] = useState(false);

  const { id, isNew } = inquiry;
  useEffect(() => { if (isNew) markInquirySeen(repo, id).catch(() => {}); }, [repo, id, isNew]);

  const linked = inquiry.customerId ? customers.find(c => c.id === inquiry.customerId) : undefined;
  const suggestion = !inquiry.customerId ? findCustomerByPhone(customers, inquiry.phone) : null;
  const Icon = SOURCE_ICON[inquiry.source];
  const closed = inquiry.status === "closed";
  const tone = inquiry.status === "open" ? "red" : inquiry.status === "answered" ? "green" : "gray";

  return (
    <article className="space-y-4" aria-label={`${inquiry.name} 문의 상세`}>
      {onBack && (
        <button type="button" onClick={onBack} className="-ml-2 inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-sm text-[#56645C] hover:text-[#1F2A24]"><ChevronLeft className="size-4" aria-hidden />문의 목록</button>
      )}

      <section className="rounded-xl border border-[#E3E8E4] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black">{inquiry.name}</h2>
          <StatusBadge tone={tone}>{INQUIRY_STATUS_LABEL[inquiry.status]}</StatusBadge>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm xl:grid-cols-2">
          <div><dt className="text-xs text-[#7A867F]">연락처</dt><dd><a href={`tel:${inquiry.phone}`} className="font-medium text-brand hover:underline">{formatPhone(inquiry.phone)}</a></dd></div>
          <div><dt className="text-xs text-[#7A867F]">이메일</dt><dd className="break-all">{inquiry.email ? <a href={`mailto:${inquiry.email}`} className="hover:underline">{inquiry.email}</a> : "-"}</dd></div>
          <div><dt className="text-xs text-[#7A867F]">경로</dt><dd className="flex items-center gap-1.5"><Icon className="size-4 text-[#56645C]" aria-hidden />{SOURCE_LABEL[inquiry.source]}</dd></div>
          <div><dt className="text-xs text-[#7A867F]">접수일시</dt><dd>{formatDateTimeKo(inquiry.createdAt)}</dd></div>
        </dl>
        <p className="mt-3 rounded-lg bg-[#F6F7F5] p-3 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-4">
          <h3 className="mb-2 text-sm font-bold">담당자</h3>
          <TaskSelect label="담당자 지정" value={inquiry.assigneeId ?? ""} options={ASSIGNEES} disabled={busy}
            onChange={v => { void run(() => assignInquiry(repo, inquiry.id, v ? (v as AdminId) : null), v ? `담당자를 ${ADMINS[v as AdminId].name}님으로 지정했어요` : "담당자를 미지정으로 바꿨어요"); }} />
        </div>
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-4">
          <h3 className="mb-2 text-sm font-bold">고객 연결</h3>
          {linked ? (
            <p className="flex flex-wrap items-center gap-2 text-sm"><CircleCheck className="size-4 text-brand" aria-hidden />연결됨 ·
              <Link href={`/admin/customers?id=${linked.id}`} className="font-bold text-brand hover:underline">{linked.name}{linked.company ? `(${linked.company})` : ""}</Link></p>
          ) : suggestion ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2"><Link2 className="mt-0.5 size-4 shrink-0 text-[#B7791F]" aria-hidden />기존 고객 {suggestion.name}{suggestion.company ? `(${suggestion.company})` : ""}과 연결</p>
              {!closed && !inquiry.projectId && (
                <button type="button" onClick={() => { setPresetCustomer(suggestion.id); setStartOpen(true); }} className="inline-flex min-h-11 items-center rounded-lg border border-brand px-3 text-sm font-bold text-brand hover:bg-[#E8F3EC] md:min-h-9">이 고객으로 의뢰 시작</button>
              )}
            </div>
          ) : <p className="text-sm text-[#7A867F]">연결된 고객이 없어요. 의뢰를 시작하면 새 고객으로 등록돼요.</p>}
        </div>
      </section>

      <section aria-label="답변 이력" className="rounded-xl border border-[#E3E8E4] bg-white p-4">
        <h3 className="mb-3 text-sm font-bold">답변 이력 <span className="font-normal text-[#7A867F]">{inquiry.replies.length}건</span></h3>
        {inquiry.replies.length === 0 ? <p className="text-sm text-[#7A867F]">아직 기록된 답변이 없어요.</p> : (
          <ol className="space-y-3 border-l-2 border-[#E3E8E4] pl-4">
            {inquiry.replies.map(r => (
              <li key={r.id} className="relative">
                <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-brand" aria-hidden />
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A867F]">
                  <AdminAvatar id={r.by} size="xs" withName />
                  <StatusBadge tone="blue">{REPLY_CHANNEL_LABEL[r.channel]}</StatusBadge>
                  <span>{formatDateTimeKo(r.at)}</span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{r.message}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {closed ? (
        <p className="rounded-xl border border-dashed border-[#D5DDD8] bg-white/70 p-4 text-sm text-[#7A867F]">종료된 문의예요. 다시 열기는 보관함에서 할 수 있어요(준비 중).</p>
      ) : (
        <>
          <ReplyForm inquiryId={inquiry.id} />
          <div className="flex flex-wrap items-center gap-2">
            {inquiry.projectId ? (
              <Link href={`/admin/projects?id=${inquiry.projectId}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark md:min-h-10"><FolderKanban className="size-4" aria-hidden />의뢰 보기</Link>
            ) : (
              <button type="button" disabled={!admin} onClick={() => { setPresetCustomer(undefined); setStartOpen(true); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60 md:min-h-10"><UserCheck className="size-4" aria-hidden />고객 등록 + 의뢰 시작</button>
            )}
            <button type="button" onClick={() => setCloseOpen(true)} className="inline-flex min-h-11 items-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium text-[#56645C] hover:bg-[#F6F7F5] md:min-h-10">종료(스팸·불발)</button>
          </div>
        </>
      )}

      <StartProjectDialog open={startOpen} onOpenChange={setStartOpen} inquiry={inquiry} presetCustomerId={presetCustomer} />
      <ConfirmDialog open={closeOpen} onOpenChange={setCloseOpen} title="이 문의를 종료할까요?" description="스팸이거나 의뢰로 이어지지 않는 문의를 종료해요. 종료하면 미답변 목록에서 빠져요." confirmLabel="종료" danger
        onConfirm={() => run(() => closeInquiry(repo, inquiry.id), "문의를 종료했어요")} />
    </article>
  );
}
