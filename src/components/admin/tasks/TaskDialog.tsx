"use client";
import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo, useSettings } from "@/data/hooks";
import { ConflictError } from "@/data/errors";
import { ADMINS, DEFAULT_SETTINGS, PRIORITY_LABEL, PRIORITY_ORDER } from "@/domain/defaults";
import { koreaDate } from "@/domain/dates";
import { resolveTaskCustomerId, taskInputSchema, type TaskInput } from "@/domain/tasks";
import type { AdminId, ISODate, Priority, Task, TaskCategory, TaskStatus } from "@/domain/types";
import { saveTask } from "@/services/taskService";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { DateField } from "@/components/common/DateField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskSelect } from "./TaskSelect";
import { CATEGORY_EXAMPLE, savedMessage, statusOptions } from "./taskForm";

type Who = AdminId | "custom";
interface Draft {
  title: string; category: TaskCategory; who: Who; customName: string; priority: Priority;
  workDate: ISODate; dueDate: ISODate; status: TaskStatus; projectId: string | null;
}

const NONE = "none";
const FORM_ID = "task-dialog-form";

export interface TaskDialogProps {
  open: boolean;
  /** 있으면 수정, 없으면 새 업무 */
  task?: Task | null;
  /** 새 업무의 기본 파트 */
  defaultCategory?: TaskCategory;
  /** 새 업무에 미리 연결할 의뢰 */
  defaultProjectId?: string | null;
  /** true면 연결 의뢰를 바꿀 수 없다(의뢰 상세에서 업무 추가할 때) */
  lockProject?: boolean;
  /** 새 업무의 기본 일정일·마감일(기본 오늘) */
  defaultDate?: ISODate;
  onOpenChange: (open: boolean) => void;
  /** 저장 성공 후(닫기 전) 호출 */
  onSaved?: (saved: Task) => void;
}

/** 업무 등록·수정 모달(기존 업무판 규칙: 디자인 완료 → 시공 및 납품 인계). */
export function TaskDialog({ open, task, defaultCategory = "design", defaultProjectId = null, lockProject, defaultDate, onOpenChange, onSaved }: TaskDialogProps) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const { items: projects } = useCollection("projects");
  const { run, busy } = useMutation();

  const defaultWho = (c: TaskCategory): Pick<Draft, "who" | "customName"> => {
    const id = settings.taskCategories.find(x => x.key === c)?.defaultAssigneeId ?? null;
    return id ? { who: id, customName: "" } : { who: "custom", customName: "" };
  };
  const init = (t: Task | null = task ?? null): Draft => {
    if (t) {
      return {
        title: t.title, category: t.category, priority: t.priority, workDate: t.workDate, dueDate: t.dueDate, status: t.status,
        projectId: t.projectId,
        who: t.assigneeId ?? "custom", customName: t.assigneeId || t.assignee === "미지정" ? "" : t.assignee,
      };
    }
    const day = defaultDate ?? koreaDate();
    return { title: "", category: defaultCategory, ...defaultWho(defaultCategory), priority: "normal", workDate: day, dueDate: day, status: "todo", projectId: defaultProjectId };
  };

  const [draft, setDraft] = useState<Draft>(init);
  const [wasOpen, setWasOpen] = useState(open);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!!task); // 닫히는 동안 task가 null이 돼도 제목이 바뀌지 않게 유지
  const [base, setBase] = useState(task ?? null); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  if (open !== wasOpen) { // 열릴 때마다 처음 값으로 되돌린다(렌더 중 상태 조정)
    setWasOpen(open);
    if (open) { setDraft(init()); setError(""); setEditing(!!task); setBase(task ?? null); }
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const info = settings.taskCategories.find(c => c.key === draft.category);
  const ownerId = settings.taskCategories.find(c => c.key === "owner")?.defaultAssigneeId ?? null;
  const ownerAssignee = ownerId ? ADMINS[ownerId].name : "미지정";
  const categoryOptions = settings.taskCategories.map(c => ({ value: c.key, label: c.label }));
  const projectOptions = useMemo(() => {
    const list = projects.filter(p => p.status === "active" || p.id === draft.projectId);
    return [{ value: NONE, label: "연결 안 함" }, ...list.map(p => ({ value: p.id, label: p.title }))];
  }, [projects, draft.projectId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !admin) return;
    const input: TaskInput = {
      title: draft.title, category: draft.category,
      assignee: draft.who === "custom" ? draft.customName : ADMINS[draft.who].name,
      assigneeId: draft.who === "custom" ? null : draft.who,
      priority: draft.priority, workDate: draft.workDate, dueDate: draft.dueDate, status: draft.status,
      projectId: draft.projectId, customerId: resolveTaskCustomerId(draft.projectId, projects, task),
    };
    const parsed = taskInputSchema.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "업무명과 날짜를 확인해주세요."); return; }
    setError("");
    const saved = await run(() => saveTask(repo, input, task && base?.id === task.id ? base : task ?? null, admin.id).catch(async er => {
      // 충돌이면 최신 내용으로 입력칸을 다시 채운다(안내 문구와 일치)
      if (er instanceof ConflictError && task) { const latest = await repo.get("tasks", task.id); if (latest) { setBase(latest); setDraft(init(latest)); } }
      throw er;
    }), undefined, { exclusive: true });
    if (!saved) return;
    toast.success(savedMessage(input, saved, !!task));
    onSaved?.(saved);
    onOpenChange(false);
  };

  const whoOptions = [
    { value: "kim", label: ADMINS.kim.name }, { value: "choi", label: ADMINS.choi.name }, { value: "custom", label: "직접 입력" },
  ];

  return (
    <ResponsiveDialog
      open={open} onOpenChange={v => { if (!busy) onOpenChange(v); }} size="lg"
      title={(open ? !!task : editing) ? "업무 수정" : "새 업무 등록"} description="파트, 담당자와 일정을 정하고 업무를 저장하세요."
      footer={<>
        <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="inline-flex items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50">취소</button>
        <button type="submit" form={FORM_ID} disabled={busy || !admin} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : task ? "변경 저장" : "업무 등록"}
        </button>
      </>}
    >
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">업무명 <span className="text-[#D64545]" aria-hidden>*</span></Label>
          <Input id="task-title" className="h-11 bg-white md:h-10" value={draft.title} onChange={e => set("title", e.target.value)} placeholder={CATEGORY_EXAMPLE[draft.category]} maxLength={160} required disabled={busy} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-category">업무 파트</Label>
            <TaskSelect id="task-category" label="업무 파트" value={draft.category} options={categoryOptions} disabled={busy}
              onChange={v => setDraft(d => ({ ...d, category: v as TaskCategory, ...defaultWho(v as TaskCategory) }))} />
            {info && <p className="text-xs text-[#5F6B64]">{info.description}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-assignee">담당자</Label>
            <TaskSelect id="task-assignee" label="담당자" value={draft.who} options={whoOptions} disabled={busy} onChange={v => set("who", v as Who)} />
            {draft.who === "custom" && (
              <Input aria-label="담당자 이름" className="h-11 bg-white md:h-10" value={draft.customName} maxLength={60} placeholder="이름 입력 (비우면 미지정)" disabled={busy} onChange={e => set("customName", e.target.value)} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-work-date">일정일 <span className="text-[#D64545]" aria-hidden>*</span></Label>
            <DateField id="task-work-date" min="2000-01-01" max="2100-12-31" value={draft.workDate} required disabled={busy} onChange={v => set("workDate", v as ISODate)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">마감일 <span className="text-[#D64545]" aria-hidden>*</span></Label>
            <DateField id="task-due-date" min="2000-01-01" max="2100-12-31" value={draft.dueDate} required disabled={busy} onChange={v => set("dueDate", v as ISODate)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-priority">우선순위</Label>
            <TaskSelect id="task-priority" label="우선순위" value={draft.priority} options={PRIORITY_ORDER.map(p => ({ value: p, label: PRIORITY_LABEL[p] }))} disabled={busy} onChange={v => set("priority", v as Priority)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-status">진행 상태</Label>
            <TaskSelect id="task-status" label="진행 상태" value={draft.status} options={statusOptions(draft.category)} disabled={busy} onChange={v => set("status", v as TaskStatus)} />
            {draft.category === "design" && <p className="text-xs text-[#5F6B64]">완료를 선택하면 같은 업무가 시공 및 납품으로 이동합니다. 담당자는 {ownerAssignee}, 상태는 예정으로 변경됩니다.</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-project">연결 의뢰 (선택)</Label>
          <TaskSelect id="task-project" label="연결 의뢰" value={draft.projectId ?? NONE} options={projectOptions} disabled={busy || lockProject}
            onChange={v => set("projectId", v === NONE ? null : v)} />
        </div>
        {error && <p className="text-sm font-medium text-[#B42323]" role="alert">{error}</p>}
      </form>
    </ResponsiveDialog>
  );
}
