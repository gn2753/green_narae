"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyDialog } from "@/components/common/PrivacyDialog";
import { useMutation, useRepo } from "@/data/hooks";
import { inquiryFormSchema } from "@/domain/inquiries";
import type { Inquiry } from "@/domain/types";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { submitWebInquiry } from "@/services/inquiryService";
import { trackPageView } from "@/services/visitTracker";
import { InquiryDoneDialog } from "./InquiryDoneDialog";

type Field = "name" | "phone" | "email" | "message" | "agree";
type Errors = Partial<Record<Field, string>>;
const MAX_MESSAGE = 2000;
const PLACEHOLDER = "가게 위치, 원하는 간판 종류, 대략적인 크기나 예산 등을 적어주시면 더 빠르게 안내드려요.";

/** 입력 중 자동 하이픈(전체 자리수가 차면 formatPhone 규칙) */
function typingPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length >= 10) return formatPhone(d);
  if (d.startsWith("02")) return d.length > 6 ? `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
  if (d.length > 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
}

const EMPTY = { name: "", phone: "", email: "", message: "" };

export function InquiryForm({ compact = false }: { compact?: boolean }) {
  const repo = useRepo();
  const { run, busy } = useMutation();
  const [values, setValues] = useState(EMPTY);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [done, setDone] = useState<Inquiry | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const set = (k: keyof typeof EMPTY, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = inquiryFormSchema.safeParse({ ...values, agree });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const saved = await run(() => submitWebInquiry(repo, parsed.data), undefined, { exclusive: true });
    if (!saved) return; // 실패: 입력 유지 + (useMutation 이 토스트 안내)
    void trackPageView("/contact/done", repo);
    setDone(saved);
    setDoneOpen(true);
    setValues(EMPTY);
    setAgree(false);
  }

  const err = (k: Field) => errors[k];
  const fieldCls = "min-h-11 rounded-lg border-2 border-ink bg-white px-3 text-base text-ink md:text-sm";

  return (
    <>
      <form
        onSubmit={onSubmit}
        noValidate
        data-compact={compact || undefined}
        className="rounded-2xl border-2 border-ink bg-white p-4 text-ink shadow-[5px_5px_0_var(--color-ink)] md:p-6"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="inq-name" className="mb-1 block text-sm font-bold">이름 <span className="text-danger">*</span></label>
            <Input id="inq-name" name="name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} aria-describedby={err("name") ? "inq-name-err" : undefined} className={fieldCls} placeholder="홍길동" />
            {err("name") && <p id="inq-name-err" role="alert" className="mt-1 text-xs text-danger">{err("name")}</p>}
          </div>
          <div>
            <label htmlFor="inq-phone" className="mb-1 block text-sm font-bold">연락처 <span className="text-danger">*</span></label>
            <Input id="inq-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", typingPhone(e.target.value))} aria-invalid={!!err("phone")} aria-describedby={err("phone") ? "inq-phone-err" : undefined} className={fieldCls} placeholder="010-1234-5678" />
            {err("phone") && <p id="inq-phone-err" role="alert" className="mt-1 text-xs text-danger">{err("phone")}</p>}
          </div>
          <div>
            <label htmlFor="inq-email" className="mb-1 block text-sm font-bold">이메일 <span className="text-danger">*</span></label>
            <Input id="inq-email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!err("email")} aria-describedby={err("email") ? "inq-email-err" : undefined} className={fieldCls} placeholder="name@example.com" />
            {err("email") && <p id="inq-email-err" role="alert" className="mt-1 text-xs text-danger">{err("email")}</p>}
          </div>
          <div>
            <label htmlFor="inq-message" className="mb-1 block text-sm font-bold">문의 내용 <span className="text-danger">*</span></label>
            <Textarea id="inq-message" name="message" rows={compact ? 4 : 6} maxLength={MAX_MESSAGE} value={values.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!err("message")} aria-describedby={err("message") ? "inq-message-err" : undefined} className={cn(fieldCls, "py-2 leading-relaxed")} placeholder={PLACEHOLDER} />
            <div className="mt-1 flex items-start justify-between gap-2">
              {err("message") ? <p id="inq-message-err" role="alert" className="text-xs text-danger">{err("message")}</p> : <span />}
              <span className="shrink-0 text-xs text-[#56645C]">{values.message.length} / {MAX_MESSAGE}</span>
            </div>
          </div>
          <div>
            <div className="flex min-h-11 items-center gap-2 text-sm">
              <Checkbox id="inq-agree" checked={agree} onCheckedChange={(c) => { setAgree(c === true); if (c) setErrors((e) => ({ ...e, agree: undefined })); }} aria-invalid={!!err("agree")} className="size-5 rounded-md border-2 border-ink" />
              <label htmlFor="inq-agree" className="cursor-pointer">개인정보 수집·이용에 동의합니다 <span className="text-danger">*</span></label>
              <button type="button" onClick={() => setPrivacyOpen(true)} className="ml-auto min-h-11 px-2 text-xs font-bold text-brand underline underline-offset-2">보기</button>
            </div>
            {err("agree") && <p role="alert" className="text-xs text-danger">{err("agree")}</p>}
          </div>
        </div>
        <button type="submit" disabled={busy} className="ink-btn mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-brand text-base text-white disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? "접수 중..." : "문의 보내기"}
        </button>
        <p className="mt-3 text-center text-xs text-[#56645C]">
          회원이신가요? <Link href="/member" className="inline-flex min-h-11 items-center font-bold text-brand underline underline-offset-2">로그인하고 문의하기</Link>
        </p>
      </form>
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <InquiryDoneDialog inquiry={done} open={doneOpen} onOpenChange={setDoneOpen} />
    </>
  );
}
