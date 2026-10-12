"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { DateField } from "@/components/common/DateField";
import { PRIORITY_LABEL, TASK_CATEGORY_ORDER, TASK_STATUS_LABEL, categoryLabel } from "@/domain/defaults";
import { sortTasksForPrint, taskAssigneeName } from "@/domain/exportSets";
import type { ISODate, Settings, Task, TaskCategory, TaskStatus } from "@/domain/types";
import { cn } from "@/lib/utils";

export type PrintScope = "all" | "filter" | "pick";
export interface PrintFilterState {
  parts: TaskCategory[]; assignee: string; from: ISODate | ""; to: ISODate | ""; statuses: TaskStatus[];
}
export const EMPTY_FILTER: PrintFilterState = { parts: [], assignee: "", from: "", to: "", statuses: [] };

export function applyPrintFilter(tasks: Task[], f: PrintFilterState): Task[] {
  return tasks.filter(t => (!f.parts.length || f.parts.includes(t.category)) && (!f.assignee || taskAssigneeName(t) === f.assignee)
    && (!f.from || t.workDate >= f.from) && (!f.to || t.workDate <= f.to) && (!f.statuses.length || f.statuses.includes(t.status)));
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
const chip = (on: boolean) => cn("inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-semibold md:min-h-9", on ? "border-[#2F8F57] bg-[#EAF4EE] text-[#1F6B3F]" : "border-[#D5DCD7] bg-white text-[#3E4A43] hover:bg-[#F6F7F5]");
const SCOPES: { key: PrintScope; label: string }[] = [{ key: "all", label: "전체" }, { key: "filter", label: "필터" }, { key: "pick", label: "직접 선택" }];

export interface PrintFiltersProps {
  tasks: Task[]; settings: Settings;
  scope: PrintScope; onScope: (s: PrintScope) => void;
  filter: PrintFilterState; onFilter: (f: PrintFilterState) => void;
  picked: Set<string>; onPicked: (s: Set<string>) => void;
}

export function PrintFilters({ tasks, settings, scope, onScope, filter, onFilter, picked, onPicked }: PrintFiltersProps) {
  const assignees = [...new Set(tasks.map(taskAssigneeName))];
  const sorted = sortTasksForPrint(tasks);
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="인쇄 범위" className="inline-flex rounded-lg bg-[#E9EDEA] p-1">
        {SCOPES.map(s => (
          <button key={s.key} type="button" role="radio" aria-checked={scope === s.key} onClick={() => onScope(s.key)}
            className={cn("min-h-11 rounded-md px-4 text-sm font-bold md:min-h-9", scope === s.key ? "bg-white text-[#1F2A24] shadow-sm" : "text-[#56645C]")}>{s.label}</button>
        ))}
      </div>

      {scope === "filter" && (
        <div className="space-y-4 rounded-xl border border-[#E3E8E4] bg-white p-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-[#1F2A24]">업무파트</legend>
            <div className="flex flex-wrap gap-2">{TASK_CATEGORY_ORDER.map(k => (
              <button key={k} type="button" aria-pressed={filter.parts.includes(k)} className={chip(filter.parts.includes(k))} onClick={() => onFilter({ ...filter, parts: toggle(filter.parts, k) })}>{categoryLabel(settings, k)}</button>
            ))}</div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-[#1F2A24]">상태</legend>
            <div className="flex flex-wrap gap-2">{(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map(k => (
              <button key={k} type="button" aria-pressed={filter.statuses.includes(k)} className={chip(filter.statuses.includes(k))} onClick={() => onFilter({ ...filter, statuses: toggle(filter.statuses, k) })}>{TASK_STATUS_LABEL[k]}</button>
            ))}</div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-bold text-[#1F2A24]">담당자
              <select value={filter.assignee} onChange={e => onFilter({ ...filter, assignee: e.target.value })} className="mt-1.5 block h-11 w-full rounded-lg border border-[#D5DCD7] bg-white px-3 text-sm font-normal md:h-10">
                <option value="">전체</option>{assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-[#1F2A24]">일정일 시작
              <DateField value={filter.from} max={filter.to || undefined} onChange={v => onFilter({ ...filter, from: v })} className="mt-1.5 h-11 md:h-10" />
            </label>
            <label className="block text-sm font-bold text-[#1F2A24]">일정일 끝
              <DateField value={filter.to} min={filter.from || undefined} onChange={v => onFilter({ ...filter, to: v })} className="mt-1.5 h-11 md:h-10" />
            </label>
          </div>
          <button type="button" className="text-sm font-semibold text-[#2F8F57] underline-offset-2 hover:underline" onClick={() => onFilter(EMPTY_FILTER)}>조건 초기화</button>
        </div>
      )}

      {scope === "pick" && (
        <div className="rounded-xl border border-[#E3E8E4] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8E4] px-4 py-2">
            <p className="text-sm font-bold text-[#1F2A24]">{picked.size}건 선택 / 전체 {tasks.length}건</p>
            <div className="flex gap-3 text-sm font-semibold text-[#2F8F57]">
              <button type="button" className="min-h-11 md:min-h-8" onClick={() => onPicked(new Set(tasks.map(t => t.id)))}>전체 선택</button>
              <button type="button" className="min-h-11 md:min-h-8" onClick={() => onPicked(new Set())}>선택 해제</button>
            </div>
          </div>
          <ul className="max-h-80 divide-y divide-[#EEF1EF] overflow-y-auto">
            {sorted.map(t => {
              const on = picked.has(t.id);
              return (
                <li key={t.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-[#F6F7F5]">
                    <Checkbox checked={on} onCheckedChange={() => { const n = new Set(picked); if (on) n.delete(t.id); else n.add(t.id); onPicked(n); }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1F2A24]">{t.title}</span>
                      <span className="block text-xs text-[#5F6B64]">{categoryLabel(settings, t.category)} · {taskAssigneeName(t)} · {PRIORITY_LABEL[t.priority]} · {TASK_STATUS_LABEL[t.status]}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
