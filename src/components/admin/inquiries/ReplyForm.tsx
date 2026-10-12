"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAdmin, useMutation, useRepo } from "@/data/hooks";
import { REPLY_CHANNEL_LABEL } from "@/domain/defaults";
import type { ReplyChannel } from "@/domain/types";
import { replyToInquiry } from "@/services/inquiryService";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CHANNELS = Object.keys(REPLY_CHANNEL_LABEL) as ReplyChannel[];

/** 답변 기록: 전달 방식 + 내용. 1차는 기록만(이메일 자동 발송은 2차). */
export function ReplyForm({ inquiryId }: { inquiryId: string }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const [channel, setChannel] = useState<ReplyChannel>("phone");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    if (!message.trim()) { setError("답변 내용을 입력해주세요."); return; }
    setError("");
    const r = await run(() => replyToInquiry(repo, inquiryId, { channel, message }, admin.id), "답변을 기록했어요", { exclusive: true });
    if (r) setMessage("");
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#E3E8E4] bg-white p-4">
      <h3 className="text-sm font-bold">답변 기록</h3>
      <div role="radiogroup" aria-label="전달 방식" className="flex flex-wrap gap-1.5">
        {CHANNELS.map(c => (
          <button key={c} type="button" role="radio" aria-checked={channel === c} disabled={busy} onClick={() => setChannel(c)}
            className={cn("min-h-11 rounded-full border px-3.5 text-sm md:min-h-9", channel === c ? "border-brand bg-[#E8F3EC] font-bold text-brand" : "border-[#D5DDD8] bg-white text-[#56645C] hover:bg-[#F6F7F5]")}>
            {REPLY_CHANNEL_LABEL[c]}
          </button>
        ))}
      </div>
      <Textarea aria-label="답변 내용" className="min-h-24 bg-white" placeholder="고객에게 전달한 답변 내용을 적어주세요." value={message} maxLength={2000} disabled={busy} onChange={e => setMessage(e.target.value)} />
      {error && <p className="text-sm font-medium text-[#B42323]" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#7A867F]">이메일 자동 발송은 2차에 연결됩니다. 지금은 전달한 내용을 기록만 해요.</p>
        <button type="submit" disabled={busy || !admin} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60 md:min-h-10">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}답변 기록
        </button>
      </div>
    </form>
  );
}
