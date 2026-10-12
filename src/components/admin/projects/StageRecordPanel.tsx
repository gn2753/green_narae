"use client";
import { useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, Save } from "lucide-react";
import { useAdmin, useMutation, useRepo } from "@/data/hooks";
import { stageLabel } from "@/domain/defaults";
import type { ActivityType, Attachment, DesignVersion, Project, Settings, StageKey, StageRecord } from "@/domain/types";
import { updateProjectFields, updateStageRecord } from "@/services/projectService";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { DateField } from "@/components/common/DateField";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeKo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LinkedMoneySummary } from "./LinkedMoneySummary";

const EMPTY: StageRecord = { fields: {}, attachments: [] };
type FieldDef = { key: string; label: string; kind: "date" | "time" | "text" | "memo"; placeholder?: string };

/** 단계별 기록 항목(spec §6.4 표). 시드 필드명: measuredAt·sizeMemo·installedOn·memo */
const FIELDS: Record<StageKey, FieldDef[]> = {
  measure: [
    { key: "measuredAt", label: "실측일", kind: "date" }, { key: "measuredTime", label: "실측 시각", kind: "time" },
    { key: "sizeMemo", label: "크기 메모", kind: "text", placeholder: "예: 전면 6.2m × 0.9m" },
    { key: "memo", label: "현장 메모", kind: "memo", placeholder: "전기 인입 위치, 건물주 허가 여부 등" },
  ],
  quote: [{ key: "memo", label: "견적 메모", kind: "memo", placeholder: "고객 요청 사항, 단가 협의 내용 등" }],
  design: [{ key: "memo", label: "디자인 메모", kind: "memo", placeholder: "고객 선호 색상·글꼴 등" }],
  install: [
    { key: "installedOn", label: "시공일", kind: "date" }, { key: "installedTime", label: "시공 시각", kind: "time" },
    { key: "memo", label: "시공 메모", kind: "memo", placeholder: "고소작업차 예약, 점등 확인 등" },
  ],
  settle: [{ key: "memo", label: "정산 메모", kind: "memo" }],
};

const isBefore = (a: Attachment) => /^(시공 전|현장)/.test(a.name);
const rename = (a: Attachment, prefix: string): Attachment => (a.name.startsWith(prefix) ? a : { ...a, name: `${prefix} · ${a.name}` });
const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-bold disabled:opacity-60 md:min-h-9";

/** 의뢰 상세 안 단계별 기록. 부모가 `key={projectId-stage}`로 다시 마운트해 입력값을 초기화한다. */
export function StageRecordPanel({ project, stage, settings }: { project: Project; stage: StageKey; settings: Settings }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const record = project.stageRecords[stage] ?? EMPTY;
  const defs = FIELDS[stage];
  const initial = () => Object.fromEntries(defs.map(d => [d.key, typeof record.fields[d.key] === "string" ? (record.fields[d.key] as string) : ""]));
  const [draft, setDraft] = useState<Record<string, string>>(initial);
  const dirty = defs.some(d => (draft[d.key] ?? "") !== (typeof record.fields[d.key] === "string" ? record.fields[d.key] : ""));
  const [newNote, setNewNote] = useState("");
  const [newAtts, setNewAtts] = useState<Attachment[]>([]);

  const save = (next: StageRecord, message: string, ok: string, type: ActivityType = "edit") =>
    admin ? run(() => updateStageRecord(repo, project.id, stage, next, project.version, admin.id, message, type), ok) : Promise.resolve(undefined);

  const saveFields = async () => {
    const fields = { ...record.fields };
    for (const d of defs) { const v = (draft[d.key] ?? "").trim(); if (v) fields[d.key] = v; else delete fields[d.key]; }
    const saved = await save({ ...record, fields }, `${stageLabel(settings, stage)} 기록 수정`, "단계 기록을 저장했어요");
    if (saved) setDraft(x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v.trim()]))); // 저장된 값(앞뒤 공백 제거)과 맞춰 버튼을 끈다
  };
  const addAttachments = (atts: Attachment[], what: string) =>
    save({ ...record, attachments: [...record.attachments, ...atts] }, `${what} ${atts.length}개 첨부`, "사진을 첨부했어요", "attach");
  const removeAttachment = (id: string) => {
    const a = record.attachments.find(x => x.id === id);
    return save({ ...record, attachments: record.attachments.filter(x => x.id !== id) }, `첨부 삭제: ${a?.name ?? "파일"}`, "첨부를 지웠어요", "attach");
  };

  const versions = record.designVersions ?? [];
  const addVersion = async () => {
    const no = Math.max(0, ...versions.map(v => v.no)) + 1;
    const v: DesignVersion = { no, ...(newNote.trim() ? { note: newNote.trim() } : {}), attachments: newAtts, confirmed: false };
    const saved = await save({ ...record, designVersions: [...versions, v] }, `디자인 시안 ${no}차 추가`, `${no}차 시안을 추가했어요`, "attach");
    if (saved) { setNewNote(""); setNewAtts([]); }
  };
  const toggleConfirm = (no: number, checked: boolean) => save(
    { ...record, designVersions: versions.map(v => ({ ...v, confirmed: v.no === no ? checked : checked ? false : v.confirmed })) },
    checked ? `${no}차 시안 고객 확정` : `${no}차 시안 확정 취소`, checked ? "고객 확정으로 표시했어요" : "확정을 취소했어요",
  );

  const fieldInput = (d: FieldDef) => {
    const id = `rec-${stage}-${d.key}`;
    const set = (v: string) => setDraft(x => ({ ...x, [d.key]: v }));
    return (
      <div key={d.key} className={cn("space-y-1.5", (d.kind === "memo" || d.kind === "text") && "col-span-2")}>
        <Label htmlFor={id}>{d.label}</Label>
        {d.kind === "date" && <DateField id={id} min="2000-01-01" max="2100-12-31" value={draft[d.key] ?? ""} disabled={busy} onChange={set} />}
        {d.kind === "time" && <Input id={id} type="time" className="h-11 bg-white md:h-10" value={draft[d.key] ?? ""} disabled={busy} onChange={e => set(e.target.value)} />}
        {d.kind === "text" && <Input id={id} className="h-11 bg-white md:h-10" value={draft[d.key] ?? ""} maxLength={200} placeholder={d.placeholder} disabled={busy} onChange={e => set(e.target.value)} />}
        {d.kind === "memo" && <Textarea id={id} className="min-h-20 bg-white" value={draft[d.key] ?? ""} maxLength={1000} placeholder={d.placeholder} disabled={busy} onChange={e => set(e.target.value)} />}
      </div>
    );
  };

  const before = record.attachments.filter(isBefore), after = record.attachments.filter(a => !isBefore(a));

  return (
    <div className="space-y-4">
      {stage === "quote" && <LinkedMoneySummary projectId={project.id} show="contract" />}

      {stage === "design" && (
        <section aria-label="시안 버전" className="space-y-3">
          {versions.length === 0 && <p className="rounded-lg bg-[#F6F7F5] px-3 py-3 text-sm text-[#5F6B64]">아직 등록된 시안이 없어요. 아래에서 첫 시안을 추가하세요.</p>}
          {[...versions].sort((a, b) => b.no - a.no).map(v => (
            <article key={v.no} className={cn("rounded-xl border p-3", v.confirmed ? "border-brand/50 bg-[#F1F8F3]" : "border-[#E3E8E4] bg-white")}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-1.5 font-bold">{v.no}차 시안{v.confirmed && <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#1E6E41]"><CheckCircle2 className="size-4" aria-hidden />고객 확정</span>}</h4>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-9">
                  <Checkbox checked={v.confirmed} disabled={busy} onCheckedChange={c => toggleConfirm(v.no, c === true)} aria-label={`${v.no}차 시안 고객 확정`} />고객 확정
                </label>
              </div>
              {v.note && <p className="mb-2 text-sm text-[#3B4A41]">{v.note}</p>}
              <AttachmentGallery items={v.attachments} emptyText="첨부 없음" />
              {v.attachments[0] && <p className="mt-1 text-xs text-[#7A867F]">{formatDateTimeKo(v.attachments[0].at)} 등록</p>}
            </article>
          ))}
          <div className="rounded-xl border border-dashed border-[#C9D1CC] bg-[#FAFBFA] p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><ImagePlus className="size-4" aria-hidden />새 시안 버전 ({Math.max(0, ...versions.map(v => v.no)) + 1}차)</h4>
            <div className="space-y-2">
              <AttachmentPicker accept="image/*" multiple label="시안 이미지 첨부" disabled={busy} onAdd={a => setNewAtts(x => [...x, ...a])} />
              <AttachmentGallery items={newAtts} onRemove={id => setNewAtts(x => x.filter(a => a.id !== id))} />
              <Label htmlFor="new-version-note" className="sr-only">시안 메모</Label>
              <Input id="new-version-note" className="h-11 bg-white md:h-10" value={newNote} maxLength={200} placeholder="메모 (예: 색상 수정 반영)" disabled={busy} onChange={e => setNewNote(e.target.value)} />
              <button type="button" onClick={addVersion} disabled={busy || newAtts.length === 0} className={cn(btn, "w-full bg-brand text-white hover:bg-brand-dark")}>
                {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}버전 추가
              </button>
              {newAtts.length === 0 && <p className="text-xs text-[#5F6B64]">이미지를 하나 이상 첨부하면 추가할 수 있어요.</p>}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">{defs.map(fieldInput)}</div>
      <div className="flex justify-end">
        <button type="button" onClick={saveFields} disabled={busy || !dirty || !admin} className={cn(btn, "bg-brand text-white hover:bg-brand-dark")}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}기록 저장
        </button>
      </div>

      {stage === "measure" && (
        <section aria-label="현장 사진" className="space-y-2">
          <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold">현장 사진</h4>
            <AttachmentPicker accept="image/*" multiple label="사진 첨부" disabled={busy} onAdd={a => addAttachments(a.map(x => rename(x, "현장")), "현장 사진")} /></div>
          <AttachmentGallery items={record.attachments} onRemove={removeAttachment} emptyText="아직 현장 사진이 없어요." />
        </section>
      )}

      {stage === "install" && (
        <>
          <section aria-label="시공 전 사진" className="space-y-2">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold">시공 전 사진</h4>
              <AttachmentPicker accept="image/*" multiple label="사진 첨부" disabled={busy} onAdd={a => addAttachments(a.map(x => rename(x, "시공 전")), "시공 전 사진")} /></div>
            <AttachmentGallery items={before} onRemove={removeAttachment} emptyText="시공 전 사진이 없어요." />
          </section>
          <section aria-label="시공 후 사진" className="space-y-2">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold">시공 후 사진</h4>
              <AttachmentPicker accept="image/*" multiple label="사진 첨부" disabled={busy} onAdd={a => addAttachments(a.map(x => rename(x, "시공 후")), "시공 후 사진")} /></div>
            <AttachmentGallery items={after} onRemove={removeAttachment} emptyText="시공 후 사진이 없어요." />
          </section>
          <LinkedMoneySummary projectId={project.id} show="orders" />
        </>
      )}

      {stage === "settle" && (
        <>
          <LinkedMoneySummary projectId={project.id} show="payments" />
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E3E8E4] bg-white px-3 py-2">
            <span><span className="block text-sm font-bold">세금계산서 발행</span><span className="text-xs text-[#5F6B64]">{project.taxInvoiceIssued ? "발행 완료로 표시됨" : "아직 발행하지 않음"}</span></span>
            <Switch checked={project.taxInvoiceIssued} disabled={busy || !admin} aria-label="세금계산서 발행 여부"
              onCheckedChange={c => admin && run(() => updateProjectFields(repo, project.id, { taxInvoiceIssued: c }, project.version, admin.id), c ? "세금계산서 발행으로 표시했어요" : "세금계산서 발행 표시를 해제했어요")} />
          </label>
        </>
      )}
    </div>
  );
}
