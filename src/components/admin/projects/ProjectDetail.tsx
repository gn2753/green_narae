"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, Check, ChevronLeft, CircleCheckBig, EllipsisVertical, Hourglass, ImageUp, ListChecks, LoaderCircle, MapPin, Pencil, Phone, Plus, RotateCcw, TriangleAlert, UserRound, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { ADMINS, DEFAULT_SETTINGS, STAGE_ORDER, TASK_STATUS_LABEL, categoryLabel, stageColor, stageLabel } from "@/domain/defaults";
import { overdueDays, waitingDays, type ProjectFieldsPatch } from "@/domain/projects";
import { isTaskOverdue } from "@/domain/tasks";
import { isValidISODate } from "@/domain/dates";
import type { AdminId, Attachment, ISODate, Project, StageKey, Task, TaskCategory } from "@/domain/types";
import { closeProject, moveStage, restoreProject, setWaiting, updateProjectFields } from "@/services/projectService";
import { registerPortfolioFromProject } from "@/services/contentService";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DateField } from "@/components/common/DateField";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TaskDialog } from "@/components/admin/tasks/TaskDialog";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityTimeline } from "./ActivityTimeline";
import { StageRecordPanel } from "./StageRecordPanel";
import { StageStepper } from "./StageStepper";
import { WaitingDialog } from "./WaitingDialog";
import { shortDate, waitingText } from "./ProjectCard";

/** 단계 → 업무 추가 시 기본 파트 */
const STAGE_TASK: Record<StageKey, TaskCategory> = { measure: "meeting", quote: "estimate", design: "design", install: "owner", settle: "admin" };
const UNASSIGNED = "none";

function Section({ title, icon: Icon, action, children }: { title: string; icon?: typeof ListChecks; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#EEF1EF] px-4 py-4 md:px-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-black text-[#1F2A24]">{Icon && <Icon className="size-4 text-[#56645C]" aria-hidden />}{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 글자 → 연필 → 입력칸(Enter·바깥 클릭 저장, Esc 취소) */
function InlineText({ value, label, onSave, disabled, className, placeholder, inputClassName }: {
  value: string; label: string; onSave: (v: string) => void; disabled?: boolean; className?: string; placeholder?: string; inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  if (editing) {
    const commit = () => { setEditing(false); if (text.trim() !== value) onSave(text); };
    return (
      <Input autoFocus aria-label={label} value={text} maxLength={160} placeholder={placeholder} className={cn("h-11 bg-white md:h-10", inputClassName)}
        onChange={e => setText(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setEditing(false); setText(value); } }} />
    );
  }
  return (
    <button type="button" disabled={disabled} onClick={() => { setText(value); setEditing(true); }} aria-label={`${label} 수정`}
      className={cn("group inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg text-left hover:bg-[#F1F4F2] disabled:opacity-60 md:min-h-8", className)}>
      <span className={cn("min-w-0 break-words", !value && "text-[#9AA59F]")}>{value || placeholder}</span>
      <Pencil className="size-3.5 shrink-0 text-[#9AA59F] group-hover:text-[#56645C]" aria-hidden />
    </button>
  );
}

/** 마감일: 입력 중에는 저장하지 않고 바깥 클릭·Enter에서 한 번 저장. 범위 밖(2000~2100)·없는 날짜는 되돌린다. Esc는 취소. */
function DueDateInput({ value, onCommit, disabled, late }: { value: ISODate | ""; onCommit: (v: ISODate | "") => void; disabled?: boolean; late?: boolean }) {
  const [text, setText] = useState<ISODate | "">(value);
  const commit = () => {
    if (text === value) return;
    if (text !== "" && !isValidISODate(text)) { toast.error("마감일은 2000-01-01 ~ 2100-12-31 사이의 날짜로 입력해주세요."); setText(value); return; }
    onCommit(text);
  };
  return (
    <DateField aria-label="마감일" min="2000-01-01" max="2100-12-31" value={text} disabled={disabled} className={cn("md:h-9", late && "border-[#F0B7B7] text-[#B42323]")}
      onChange={setText} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setText(value); } }} />
  );
}

/** 의뢰 상세(데스크톱 오른쪽 480px 패널 / 모바일 전체 화면). A03 고객 상세에서도 쓴다. */
export function ProjectDetail({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { items: projects, loading } = useCollection("projects");
  const project = projects.find(p => p.id === projectId);
  return (
    <Sheet open onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" showCloseButton={false}
        className="gap-0 bg-white p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none md:data-[side=right]:w-[480px] md:data-[side=right]:max-w-[480px]">
        {project ? <DetailBody key={project.id} project={project} onClose={onClose} /> : (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <SheetTitle className="text-base font-bold">의뢰 상세</SheetTitle>
              <button type="button" onClick={onClose} aria-label="닫기" className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-[#EEF1EF]"><X className="size-5" aria-hidden /></button>
            </div>
            <SheetDescription className="p-6 text-center text-sm text-[#5F6B64]">{loading ? "불러오는 중…" : "의뢰를 찾을 수 없어요. 삭제되었거나 주소가 잘못되었어요."}</SheetDescription>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const repo = useRepo();
  const router = useRouter();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const today = useToday();
  const { run, busy } = useMutation();
  const { items: customers } = useCollection("customers");
  const { items: tasks } = useCollection("tasks");
  const customer = customers.find(c => c.id === p.customerId);
  const linked = useMemo(() => tasks.filter(t => t.projectId === p.id).sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || a.dueDate.localeCompare(b.dueDate)), [tasks, p.id]);

  const [selStage, setSelStage] = useState<StageKey>(p.stage);
  const [seenStage, setSeenStage] = useState(p.stage);
  if (seenStage !== p.stage) { setSeenStage(p.stage); setSelStage(p.stage); } // 단계가 바뀌면 새 단계 기록을 보여준다
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [taskDialog, setTaskDialog] = useState<{ task: Task | null } | null>(null);
  const [confirm, setConfirm] = useState<"done" | "closed" | null>(null);

  const active = p.status === "active";
  const idx = STAGE_ORDER.indexOf(p.stage);
  const next = STAGE_ORDER[idx + 1];
  const late = overdueDays(p, today);
  const wDays = waitingDays(p, today);
  const canEdit = !!admin && !busy;

  const edit = (patch: ProjectFieldsPatch, ok = "변경 내용을 저장했어요") => admin && run(() => updateProjectFields(repo, p.id, patch, p.version, admin.id), ok);
  const toNext = () => admin && next && run(() => moveStage(repo, p.id, next, p.version, admin.id), `${stageLabel(settings, next)} 단계로 옮겼어요`);
  const toggleWaiting = (on: boolean) => {
    if (on) setWaitingOpen(true);
    else if (admin) void run(() => setWaiting(repo, p.id, null, p.version, admin.id), "대기를 해제했어요");
  };
  const registerPortfolio = async () => {
    if (!admin) return;
    const had = !!p.portfolioId;
    const pf = await run(() => registerPortfolioFromProject(repo, p.id, admin.id));
    if (!pf) return;
    toast.success(had ? "이미 등록된 시공사례가 있어요" : "시공사례 초안을 만들었어요", {
      description: had ? undefined : "비공개 초안이에요. 사진과 설명을 다듬은 뒤 공개하세요.",
      action: { label: "편집하기", onClick: () => router.push(`/admin/content?portfolio=${pf.id}`) },
      duration: 8000,
    });
  };
  const restore = () => admin && run(() => restoreProject(repo, p.id, admin.id), "의뢰를 다시 진행 중으로 돌렸어요");

  const allAttachments = useMemo(() => {
    const out: Attachment[] = [];
    for (const k of STAGE_ORDER) {
      const r = p.stageRecords[k]; if (!r) continue;
      for (const v of r.designVersions ?? []) out.push(...v.attachments);
      out.push(...r.attachments);
    }
    return out;
  }, [p.stageRecords]);

  const assigneeOptions = [{ value: "kim", label: ADMINS.kim.name }, { value: "choi", label: ADMINS.choi.name }, { value: UNASSIGNED, label: "미지정" }];
  const signTypes = settings.signTypes.includes(p.signType) ? settings.signTypes : [p.signType, ...settings.signTypes];
  const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold disabled:opacity-50";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 상단 막대 */}
      <div className="flex shrink-0 items-center gap-1 border-b border-[#E3E8E4] px-2 py-1.5">
        <button type="button" onClick={onClose} className="inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-sm text-[#56645C] hover:bg-[#EEF1EF] md:hidden"><ChevronLeft className="size-4" aria-hidden />목록</button>
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white max-md:hidden" style={{ background: stageColor(settings, p.stage) }}>{stageLabel(settings, p.stage)}</span>
        <span className="ml-1 text-xs text-[#7A867F] max-md:hidden">의뢰 상세</span>
        <span className="ml-auto" />
        {!active && <StatusBadge tone={p.status === "done" ? "green" : "gray"}>{p.status === "done" ? "완료" : "종료"}</StatusBadge>}
        <button type="button" onClick={onClose} aria-label="닫기" className="inline-flex size-11 items-center justify-center rounded-lg text-[#56645C] hover:bg-[#EEF1EF] max-md:hidden"><X className="size-5" aria-hidden /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* 헤더 */}
        <div className="space-y-2 px-4 pt-3 pb-4 md:px-5">
          <span className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white md:hidden" style={{ background: stageColor(settings, p.stage) }}>{stageLabel(settings, p.stage)}</span>
          <SheetTitle className="sr-only">{p.title}</SheetTitle>
          <SheetDescription className="sr-only">{customer?.name ?? ""} 고객의 의뢰 상세</SheetDescription>
          <InlineText value={p.title} label="건명" disabled={!canEdit} onSave={v => edit({ title: v }, "건명을 바꿨어요")} className="-ml-1 px-1 text-xl font-black text-[#1F2A24]" />
          <div className="flex flex-wrap items-center gap-2">
            {late > 0 && <StatusBadge tone="red" dot><TriangleAlert className="size-3" aria-hidden />{late}일 지연</StatusBadge>}
            {p.waiting && <StatusBadge tone="yellow"><Hourglass className="size-3" aria-hidden />{p.waiting.reason} · {waitingText(wDays)}</StatusBadge>}
            {p.portfolioId && <StatusBadge tone="blue">시공사례 등록됨</StatusBadge>}
          </div>
          <dl className="grid grid-cols-[76px_1fr] items-center gap-x-2 gap-y-1.5 text-sm">
            <dt className="text-[#5F6B64]">간판 종류</dt>
            <dd><TaskSelect label="간판 종류" value={p.signType} options={signTypes.map(s => ({ value: s, label: s }))} disabled={!canEdit} onChange={v => edit({ signType: v }, "간판 종류를 바꿨어요")} className="md:h-9" /></dd>
            <dt className="flex items-center gap-1 text-[#5F6B64]"><MapPin className="size-3.5" aria-hidden />현장</dt>
            <dd className="min-w-0"><InlineText value={p.siteAddress ?? ""} label="현장 주소" placeholder="현장 주소 입력" disabled={!canEdit} onSave={v => edit({ siteAddress: v }, "현장 주소를 저장했어요")} className="-ml-1 px-1" /></dd>
            <dt className="flex items-center gap-1 text-[#5F6B64]"><UserRound className="size-3.5" aria-hidden />담당자</dt>
            <dd><TaskSelect label="담당자" value={p.assigneeId ?? UNASSIGNED} options={assigneeOptions} disabled={!canEdit}
              onChange={v => edit({ assigneeId: v === UNASSIGNED ? null : (v as AdminId) }, "담당자를 바꿨어요")} className="md:h-9" /></dd>
            <dt className="flex items-center gap-1 text-[#5F6B64]"><CalendarDays className="size-3.5" aria-hidden />마감일</dt>
            <dd><DueDateInput key={p.dueDate ?? ""} value={p.dueDate ?? ""} disabled={!canEdit} late={late > 0}
              onCommit={v => edit({ dueDate: v }, v ? "마감일을 바꿨어요" : "마감일을 지웠어요")} /></dd>
          </dl>
        </div>

        {!active && (
          <div className="mx-4 mb-4 flex items-center justify-between gap-2 rounded-xl bg-[#F1F4F2] px-3 py-2 text-sm md:mx-5">
            <span>{p.status === "done" ? "완료 처리된 의뢰예요. 보드에는 보이지 않아요." : "종료한 의뢰예요. 보드에는 보이지 않아요."}</span>
            <button type="button" onClick={restore} disabled={!canEdit} className={cn(btn, "shrink-0 border border-[#D5DDD8] bg-white text-[#1F2A24] md:min-h-9")}><RotateCcw className="size-4" aria-hidden />다시 진행</button>
          </div>
        )}

        {/* 대기 */}
        <div className="mx-4 mb-4 rounded-xl border border-[#E3E8E4] px-3 py-2 md:mx-5">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold"><Hourglass className="size-4 text-[#8A6400]" aria-hidden />대기 중</span>
              <span className="block text-xs text-[#5F6B64]">
                {p.waiting ? <>{p.waiting.reason} · {waitingText(wDays)}{p.waiting.expectedDate && ` · 예상 ${shortDate(p.waiting.expectedDate)}`}</> : "고객 회신·입금 등을 기다릴 때 켜세요"}
              </span>
            </span>
            <Switch checked={!!p.waiting} disabled={!canEdit || !active} onCheckedChange={toggleWaiting} aria-label="대기 표시" />
          </label>
        </div>

        {/* 단계 */}
        <Section title="단계별 기록">
          <StageStepper settings={settings} current={p.stage} selected={selStage} onSelect={setSelStage} />
          <div className="mt-3 rounded-xl bg-[#FAFBFA] p-3 ring-1 ring-[#EEF1EF]">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
              <span className="size-2.5 rounded-full" style={{ background: stageColor(settings, selStage) }} aria-hidden />{stageLabel(settings, selStage)} 기록
              {selStage === p.stage && <span className="text-xs font-normal text-[#5F6B64]">(현재 단계)</span>}
            </h4>
            <StageRecordPanel key={`${p.id}-${selStage}`} project={p} stage={selStage} settings={settings} />
          </div>
        </Section>

        {/* 고객 */}
        <Section title="고객" icon={Building2}>
          {customer ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E3E8E4] p-3">
              <div className="min-w-0">
                <p className="font-bold">{customer.name}{customer.company && <span className="ml-1 font-normal text-[#5F6B64]">· {customer.company}</span>}</p>
                <button type="button" onClick={() => toast("2차 연동 예정 기능입니다", { description: `${formatPhone(customer.phone)}로 전화 걸기` })}
                  className="inline-flex min-h-11 items-center gap-1 text-sm text-brand hover:underline md:min-h-8"><Phone className="size-3.5" aria-hidden />{formatPhone(customer.phone)}</button>
              </div>
              <Link href={`/admin/customers?id=${customer.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D5DDD8] bg-white px-3 text-sm font-bold text-[#1F2A24] hover:bg-[#F6F7F5] md:min-h-9">고객 상세<ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          ) : <p className="text-sm text-[#7A867F]">고객 정보를 찾을 수 없어요.</p>}
        </Section>

        {/* 연결 업무 */}
        <Section title={`연결 업무 ${linked.length ? `${linked.filter(t => t.status === "done").length}/${linked.length}` : ""}`} icon={ListChecks}
          action={<button type="button" onClick={() => setTaskDialog({ task: null })} disabled={!admin} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand hover:bg-[#E8F3EC] md:min-h-8"><Plus className="size-4" aria-hidden />업무 추가</button>}>
          {linked.length === 0 ? <p className="text-sm text-[#7A867F]">연결된 업무가 없어요.</p> : (
            <ul className="space-y-1.5">
              {linked.map(t => {
                const overdue = isTaskOverdue(t, today);
                return (
                  <li key={t.id}>
                    <button type="button" onClick={() => setTaskDialog({ task: t })} className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[#EEF1EF] bg-white px-3 py-2 text-left hover:bg-[#F6F7F5]">
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", t.status === "done" ? "border-brand bg-brand text-white" : "border-[#C9D1CC]")}>{t.status === "done" && <Check className="size-3" aria-hidden />}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", t.status === "done" && "text-[#7A867F] line-through")}>{t.title}</span>
                        <span className="block text-xs text-[#5F6B64]">{categoryLabel(settings, t.category)} · {t.assignee} · {TASK_STATUS_LABEL[t.status]}</span>
                      </span>
                      <span className={cn("shrink-0 text-xs", overdue ? "font-bold text-[#B42323]" : "text-[#5F6B64]")}>{shortDate(t.dueDate)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title={`첨부 ${allAttachments.length}`} icon={ImageUp}>
          <AttachmentGallery items={allAttachments} emptyText="첨부가 없어요. 단계별 기록에서 사진·시안을 올리세요." />
        </Section>

        <Section title="활동 기록">
          <ActivityTimeline projectId={p.id} />
        </Section>
      </div>

      {/* 하단 버튼 */}
      {active && (
        <div className="flex shrink-0 items-center gap-2 border-t border-[#E3E8E4] bg-[#FAFBFA] px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {next ? (
            <button type="button" onClick={toNext} disabled={!canEdit} className={cn(btn, "min-w-0 flex-1 bg-brand text-white hover:bg-brand-dark")}>
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              <span className="truncate">다음 단계로: {stageLabel(settings, next)} →</span>
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm("done")} disabled={!canEdit} className={cn(btn, "min-w-0 flex-1 bg-brand text-white hover:bg-brand-dark")}><CircleCheckBig className="size-4" aria-hidden />완료 처리</button>
          )}
          <button type="button" onClick={() => toggleWaiting(!p.waiting)} disabled={!canEdit} className={cn(btn, "shrink-0 border border-[#E9D59A] bg-[#FFF8E5] text-[#8A6400] hover:bg-[#FFF1CC]")}>
            {p.waiting ? "대기 해제" : "⏳ 대기 표시"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="더보기" disabled={!admin} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white text-[#3B4A41] hover:bg-[#F6F7F5] disabled:opacity-50">
              <EllipsisVertical className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52">
              {(p.stage === "install" || p.stage === "settle") && (
                <DropdownMenuItem className="min-h-10" onClick={() => (p.portfolioId ? router.push(`/admin/content?portfolio=${p.portfolioId}`) : registerPortfolio())}><ImageUp className="size-4" aria-hidden />{p.portfolioId ? "시공사례 보기" : "시공사례로 등록"}</DropdownMenuItem>
              )}
              <DropdownMenuItem className="min-h-10" onClick={() => setConfirm("done")}><CircleCheckBig className="size-4" aria-hidden />완료 처리</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10" variant="destructive" onClick={() => setConfirm("closed")}><XCircle className="size-4" aria-hidden />종료</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <WaitingDialog open={waitingOpen} project={p} onOpenChange={setWaitingOpen} />
      <TaskDialog open={!!taskDialog} task={taskDialog?.task ?? null} defaultCategory={STAGE_TASK[p.stage]} defaultProjectId={p.id} lockProject
        onOpenChange={o => { if (!o) setTaskDialog(null); }} />
      <ConfirmDialog open={!!confirm} onOpenChange={o => { if (!o) setConfirm(null); }}
        title={confirm === "done" ? "이 의뢰를 완료 처리할까요?" : "이 의뢰를 종료할까요?"}
        description={confirm === "done" ? "보드에서 빠지고 보관함으로 이동해요. 필요하면 다시 진행할 수 있어요." : "진행하지 않기로 한 의뢰를 정리해요. 보드에서 빠지고, 필요하면 다시 진행할 수 있어요."}
        confirmLabel={confirm === "done" ? "완료 처리" : "종료"} danger={confirm === "closed"}
        onConfirm={async () => { if (admin && confirm) await run(() => closeProject(repo, p.id, confirm, admin.id), confirm === "done" ? "의뢰를 완료 처리했어요" : "의뢰를 종료했어요"); }} />
    </div>
  );
}
