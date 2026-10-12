"use client";
import { useState } from "react";
import { useRepo } from "@/data/DataProvider";
import { useMutation, useSettings } from "@/data/hooks";
import { ADMINS, ADMIN_IDS } from "@/domain/defaults";
import type { AdminId, Settings } from "@/domain/types";
import { TagEditor } from "./TagEditor";
import { cardCls, fieldCls, primaryBtn } from "./settingsUi";

type Cat = Settings["taskCategories"][number];
type Stage = Settings["stages"][number];

function AssigneeSelect({ id, label, value, onChange, disabled }: { id: string; label: string; value: AdminId | null; onChange: (v: AdminId | null) => void; disabled?: boolean }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-bold text-[#56645C]">{label}</label>
      <select id={id} className={fieldCls} value={value ?? ""} disabled={disabled} onChange={e => onChange((e.target.value || null) as AdminId | null)}>
        <option value="">지정 안 함</option>
        {ADMIN_IDS.map(a => <option key={a} value={a}>{ADMINS[a].name}</option>)}
      </select>
    </div>
  );
}

function dupLabel(labels: string[]): string | null {
  const t = labels.map(l => l.trim());
  if (t.some(l => !l)) return "이름은 비워둘 수 없어요.";
  if (new Set(t.map(l => l.toLowerCase())).size !== t.length) return "같은 이름이 있어요. 서로 다르게 적어주세요.";
  return null;
}

function TaskCategoryForm({ initial }: { initial: Cat[] }) {
  const repo = useRepo();
  const { run, busy } = useMutation();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const set = (key: string, patch: Partial<Cat>) => { setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r)); setError(null); };
  const save = async () => {
    const e = dupLabel(rows.map(r => r.label));
    if (e) { setError(e); return; }
    const next = rows.map(r => ({ ...r, label: r.label.trim(), description: r.description.trim() }));
    await run(() => repo.updateSettings({ taskCategories: next }), "업무 파트 설정을 저장했어요", { exclusive: true });
  };
  return (
    <section className={cardCls}>
      <h2 className="text-sm font-bold">업무 파트</h2>
      <p className="mb-3 text-sm text-[#56645C]">이름·설명·기본 담당은 바꿀 수 있어요. 파트 종류 자체는 고정이라 추가·삭제는 할 수 없어요.</p>
      <ul className="space-y-3">
        {rows.map(r => (
          <li key={r.key} className="grid min-w-0 gap-2 rounded-lg border border-[#E3E8E4] p-3 md:grid-cols-[1fr_2fr_11rem]">
            <div className="min-w-0"><label htmlFor={`cat-${r.key}-l`} className="mb-1 block text-xs font-bold text-[#56645C]">이름</label><input id={`cat-${r.key}-l`} className={fieldCls} value={r.label} maxLength={12} disabled={busy} onChange={e => set(r.key, { label: e.target.value })} /></div>
            <div className="min-w-0"><label htmlFor={`cat-${r.key}-d`} className="mb-1 block text-xs font-bold text-[#56645C]">설명</label><input id={`cat-${r.key}-d`} className={fieldCls} value={r.description} maxLength={40} disabled={busy} onChange={e => set(r.key, { description: e.target.value })} /></div>
            <AssigneeSelect id={`cat-${r.key}-a`} label="기본 담당" value={r.defaultAssigneeId} disabled={busy} onChange={v => set(r.key, { defaultAssigneeId: v })} />
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm font-bold text-[#B3402A]">{error}</p>}
      <div className="mt-3 flex justify-end"><button type="button" className={primaryBtn} disabled={!dirty || busy} onClick={save}>저장</button></div>
    </section>
  );
}

function StageForm({ initial }: { initial: Stage[] }) {
  const repo = useRepo();
  const { run, busy } = useMutation();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const set = (key: string, patch: Partial<Stage>) => { setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r)); setError(null); };
  const save = async () => {
    const e = dupLabel(rows.map(r => r.label));
    if (e) { setError(e); return; }
    const next = rows.map(r => ({ ...r, label: r.label.trim() }));
    await run(() => repo.updateSettings({ stages: next }), "의뢰 단계 설정을 저장했어요", { exclusive: true });
  };
  return (
    <section className={cardCls}>
      <h2 className="text-sm font-bold">의뢰 단계</h2>
      <p className="mb-3 text-sm text-[#56645C]">단계 이름·색·기본 담당을 바꿀 수 있어요. 단계 순서와 종류는 고정이에요.</p>
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.key} className="grid min-w-0 gap-2 rounded-lg border border-[#E3E8E4] p-3 md:grid-cols-[1fr_8rem_11rem]">
            <div className="min-w-0"><label htmlFor={`st-${r.key}-l`} className="mb-1 block text-xs font-bold text-[#56645C]">{i + 1}단계 이름</label><input id={`st-${r.key}-l`} className={fieldCls} value={r.label} maxLength={12} disabled={busy} onChange={e => set(r.key, { label: e.target.value })} /></div>
            <div className="min-w-0"><label htmlFor={`st-${r.key}-c`} className="mb-1 block text-xs font-bold text-[#56645C]">색</label>
              <div className="flex items-center gap-2"><input id={`st-${r.key}-c`} type="color" className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-[#D5DDD8] bg-white p-1 md:h-10" value={r.color} disabled={busy} onChange={e => set(r.key, { color: e.target.value.toUpperCase() })} /><span className="text-xs tabular-nums text-[#56645C]">{r.color}</span></div></div>
            <AssigneeSelect id={`st-${r.key}-a`} label="기본 담당" value={r.defaultAssigneeId} disabled={busy} onChange={v => set(r.key, { defaultAssigneeId: v })} />
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm font-bold text-[#B3402A]">{error}</p>}
      <div className="mt-3 flex justify-end"><button type="button" className={primaryBtn} disabled={!dirty || busy} onClick={save}>저장</button></div>
    </section>
  );
}

type TagKey = "waitingReasons" | "signTypes" | "purchaseCategories" | "vendorFields";
const TAGS: { key: TagKey; title: string; hint: string }[] = [
  { key: "waitingReasons", title: "대기 사유", hint: "의뢰를 ‘대기’로 표시할 때 고르는 이유" },
  { key: "signTypes", title: "간판 종류", hint: "의뢰·포트폴리오에서 고르는 간판 종류" },
  { key: "purchaseCategories", title: "매입 비용 항목", hint: "매입·매출 장부의 비용 분류" },
  { key: "vendorFields", title: "업체 분야", hint: "제작업체 등록 시 고르는 분야" },
];

export function CategorySettings() {
  const repo = useRepo();
  const settings = useSettings();
  const { run, busy } = useMutation();
  if (!settings) return <p className="py-10 text-center text-sm text-[#56645C]">불러오는 중…</p>;
  const saveTags = (key: TagKey) => (next: string[]) => run(() => repo.updateSettings({ [key]: next }), undefined);
  return (
    <>
      {/* 저장된 값이 바뀌면(다른 탭·되돌리기) 폼을 새 값으로 다시 시작한다 */}
      <TaskCategoryForm key={JSON.stringify(settings.taskCategories)} initial={settings.taskCategories} />
      <StageForm key={JSON.stringify(settings.stages)} initial={settings.stages} />
      <section className={cardCls}>
        <h2 className="text-sm font-bold">선택 목록</h2>
        <p className="mb-3 text-sm text-[#56645C]">추가·삭제는 바로 저장돼요. 삭제해도 이미 저장된 기록에는 기존 값이 그대로 남아요.</p>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {TAGS.map(t => <TagEditor key={t.key} id={`tag-${t.key}`} title={t.title} hint={t.hint} values={settings[t.key]} busy={busy} onChange={saveTags(t.key)} />)}
        </div>
      </section>
    </>
  );
}
