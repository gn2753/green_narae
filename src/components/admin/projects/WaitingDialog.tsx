"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAdmin, useMutation, useRepo, useSettings } from "@/data/hooks";
import { DEFAULT_SETTINGS } from "@/domain/defaults";
import type { ISODate, Project } from "@/domain/types";
import { setWaiting } from "@/services/projectService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { DateField } from "@/components/common/DateField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CUSTOM = "__custom";
const FORM_ID = "waiting-dialog-form";

/** 대기 표시: 사유(설정의 사유 목록 또는 직접 입력) + 예상일(선택). */
export function WaitingDialog({ open, project, onOpenChange }: { open: boolean; project: Project; onOpenChange: (o: boolean) => void }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const { run, busy } = useMutation();
  const [reason, setReason] = useState<string>(settings.waitingReasons[0] ?? CUSTOM);
  const [custom, setCustom] = useState("");
  const [expected, setExpected] = useState<ISODate | "">("");
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setReason(settings.waitingReasons[0] ?? CUSTOM); setCustom(""); setExpected(""); setError(""); }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    const text = (reason === CUSTOM ? custom : reason).trim();
    if (!text) { setError("대기 사유를 입력해주세요."); return; }
    const saved = await run(() => setWaiting(repo, project.id, { reason: text, ...(expected ? { expectedDate: expected } : {}) }, project.version, admin.id), "대기로 표시했어요", { exclusive: true });
    if (saved) onOpenChange(false);
  };

  const chip = (value: string, label: string) => (
    <button key={value} type="button" role="radio" aria-checked={reason === value} onClick={() => setReason(value)} disabled={busy}
      className={cn("min-h-11 rounded-full border px-3.5 text-sm md:min-h-9", reason === value ? "border-brand bg-brand font-bold text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5]")}>
      {label}
    </button>
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="sm" title="대기 표시"
      description="무엇을 기다리는지 적어두면 보드 카드에 ‘N일째’로 표시돼요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}대기로 표시
        </button>
      </>}>
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium" id="waiting-reason-label">대기 사유</p>
          <div role="radiogroup" aria-labelledby="waiting-reason-label" className="flex flex-wrap gap-2">
            {settings.waitingReasons.map(r => chip(r, r))}
            {chip(CUSTOM, "직접 입력")}
          </div>
          {reason === CUSTOM && (
            <Input aria-label="대기 사유 직접 입력" className="h-11 bg-white md:h-10" value={custom} maxLength={60} placeholder="예: 건물주 허가" autoFocus disabled={busy} onChange={e => setCustom(e.target.value)} />
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waiting-expected">예상일 (선택)</Label>
          <DateField id="waiting-expected" min="2000-01-01" max="2100-12-31" value={expected} disabled={busy} onChange={v => setExpected(v as ISODate | "")} />
        </div>
        {error && <p className="text-sm font-medium text-[#B42323]" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
