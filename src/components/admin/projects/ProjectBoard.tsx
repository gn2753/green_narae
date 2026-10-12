"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { FolderKanban, Plus, Search, X } from "lucide-react";
import { useAdmin, useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { DEFAULT_SETTINGS, STAGE_ORDER, stageColor, stageLabel } from "@/domain/defaults";
import { compareBoardProjects, skipConfirmTitle, skippedStages } from "@/domain/projects";
import type { Project, StageKey } from "@/domain/types";
import { moveStage } from "@/services/projectService";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { a02TabItems } from "@/components/admin/tasks/A02Tabs";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useIsMobile } from "@/components/common/useIsMobile";
import { cn } from "@/lib/utils";
import { NewProjectDialog } from "./NewProjectDialog";
import { ProjectCard, ProjectCardPreview } from "./ProjectCard";
import { ProjectColumn } from "./ProjectColumn";
import { ProjectDetail } from "./ProjectDetail";

type AssigneeFilter = "all" | "kim" | "choi" | "none";
const FILTERS: { value: AssigneeFilter; label: string }[] = [
  { value: "all", label: "전체" }, { value: "kim", label: "김자연" }, { value: "choi", label: "최관웅" }, { value: "none", label: "미지정" },
];
const digits = (s: string) => s.replace(/\D/g, "");
const isStage = (v: string | null): v is StageKey => !!v && (STAGE_ORDER as string[]).includes(v);

/** A02-② 의뢰 진행 보드. `?stage=` 열 강조·스크롤, `?id=` 상세 열기, `?new=1` 새 의뢰. */
export function ProjectBoard() {
  const repo = useRepo();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { admin } = useAdmin();
  const settings = useSettings() ?? DEFAULT_SETTINGS;
  const today = useToday();
  const isMobile = useIsMobile();
  const { items: projects, loading } = useCollection("projects");
  const { items: customers } = useCollection("customers");
  const { items: tasks } = useCollection("tasks");
  const { run } = useMutation();

  const stageParam = params.get("stage");
  const highlight = isStage(stageParam) ? stageParam : null;
  const detailId = params.get("id");
  const isNew = params.get("new") === "1";

  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [query, setQuery] = useState("");
  const [mobileStage, setMobileStage] = useState<StageKey>(highlight ?? "measure");
  const [seenHighlight, setSeenHighlight] = useState(highlight);
  if (highlight !== seenHighlight) { setSeenHighlight(highlight); if (highlight) setMobileStage(highlight); }
  const [pending, setPending] = useState<{ project: Project; to: StageKey } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const colRefs = useRef<Partial<Record<StageKey, HTMLElement | null>>>({});

  const go = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  // 모바일: 선택한 단계 탭이 보이도록 탭 줄을 스크롤
  useEffect(() => {
    if (!isMobile) return;
    document.getElementById(`stage-tab-${mobileStage}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [mobileStage, isMobile]);

  // ?stage= → 해당 열로 스크롤(데스크톱은 가로 스크롤 안에서)
  useEffect(() => {
    if (!highlight || loading) return;
    const el = colRefs.current[highlight];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [highlight, loading]);

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const progress = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const t of tasks) {
      if (!t.projectId) continue;
      const x = m.get(t.projectId) ?? { done: 0, total: 0 };
      x.total++; if (t.status === "done") x.done++;
      m.set(t.projectId, x);
    }
    return m;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase(), qd = digits(query);
    return projects
      .filter(p => p.status === "active")
      .filter(p => assignee === "all" || (assignee === "none" ? p.assigneeId === null : p.assigneeId === assignee))
      .filter(p => {
        if (!q) return true;
        const c = customerMap.get(p.customerId);
        return p.title.toLowerCase().includes(q) || !!c?.name.toLowerCase().includes(q) || !!c?.company?.toLowerCase().includes(q) || (qd.length >= 3 && !!c && digits(c.phone).includes(qd));
      })
      .sort((a, b) => compareBoardProjects(a, b, today));
  }, [projects, assignee, query, customerMap, today]);
  const byStage = (k: StageKey) => visible.filter(p => p.stage === k);
  const activeCount = projects.filter(p => p.status === "active").length;

  const doMove = async (p: Project, to: StageKey) => {
    if (!admin || busyIds.has(p.id)) return;
    setBusyIds(s => new Set(s).add(p.id));
    try {
      await run(() => moveStage(repo, p.id, to, p.version, admin.id), `${p.title} → ${stageLabel(settings, to)}`);
    } finally {
      setBusyIds(s => { const n = new Set(s); n.delete(p.id); return n; });
    }
  };
  const requestMove = (p: Project, to: StageKey) => {
    if (to === p.stage) return;
    if (skippedStages(p.stage, to).length) setPending({ project: p, to });
    else void doMove(p, to); // 다음 단계·되돌리기는 확인 없이
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragStart = (e: DragStartEvent) => setDragId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null);
    const p = projects.find(x => x.id === e.active.id);
    const to = e.over?.id;
    if (p && isStage(typeof to === "string" ? to : null)) requestMove(p, to as StageKey);
  };
  const dragProject = dragId ? projects.find(p => p.id === dragId) : undefined;

  // 모바일: 좌우 스와이프로 단계 탭 전환
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s || !isMobile) return;
    const t = e.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = STAGE_ORDER.indexOf(mobileStage);
    const next = STAGE_ORDER[i + (dx < 0 ? 1 : -1)];
    if (next) setMobileStage(next);
  };

  const cardProps = (p: Project) => ({
    project: p, customer: customerMap.get(p.customerId), settings, today, progress: progress.get(p.id) ?? { done: 0, total: 0 },
    onOpen: (x: Project) => go({ id: x.id, new: null }), onMove: requestMove, dragEnabled: !isMobile, busy: busyIds.has(p.id),
  });

  return (
    <>
      <PageHeader title="업무·일정" description={<>고객 의뢰가 지금 어느 단계에 있는지 한눈에 봐요.<span className="max-md:hidden"> 카드를 끌어 다른 단계로 옮길 수 있어요.</span></>}
        tabs={a02TabItems("projects")}
        actions={<button type="button" onClick={() => go({ new: "1", id: null })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"><Plus className="size-4" aria-hidden />새 의뢰</button>} />

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div role="radiogroup" aria-label="담당자" className="inline-flex max-w-full self-start overflow-x-auto rounded-lg bg-[#EEF1EF] p-0.5">
          {FILTERS.map(f => (
            <button key={f.value} type="button" role="radio" aria-checked={assignee === f.value} onClick={() => setAssignee(f.value)}
              className={cn("min-h-10 shrink-0 rounded-md px-3 text-sm whitespace-nowrap md:min-h-8", assignee === f.value ? "bg-white font-bold text-[#1F2A24] shadow-sm" : "text-[#5F6B64] hover:text-[#1F2A24]")}>{f.label}</button>
          ))}
        </div>
        <label className="relative flex h-11 w-full items-center rounded-lg border border-[#D5DDD8] bg-white md:h-10 md:w-72">
          <Search className="ml-3 size-4 shrink-0 text-[#7A867F]" aria-hidden />
          <span className="sr-only">의뢰 검색</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="건명·고객명·연락처 검색" className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none [&::-webkit-search-cancel-button]:hidden" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="inline-flex size-10 items-center justify-center text-[#7A867F]"><X className="size-4" aria-hidden /></button>}
        </label>
      </div>

      {!loading && activeCount === 0 ? (
        <EmptyState icon={FolderKanban} title="진행 중인 의뢰가 없어요" description="문의에서 의뢰를 시작하거나 새 의뢰를 등록하세요."
          action={<button type="button" onClick={() => go({ new: "1" })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white"><Plus className="size-4" aria-hidden />새 의뢰</button>} />
      ) : (
        <>
          {(query || assignee !== "all") && !loading && <p className="mb-2 text-sm text-[#56645C]">조건에 맞는 의뢰 {visible.length}건</p>}
          <div role="tablist" aria-label="의뢰 단계" className="mb-3 flex gap-1.5 overflow-x-auto md:hidden">
            {STAGE_ORDER.map(k => {
              const sel = mobileStage === k;
              return (
                <button key={k} id={`stage-tab-${k}`} type="button" role="tab" aria-selected={sel} onClick={() => setMobileStage(k)}
                  className={cn("inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap", sel ? "border-transparent font-bold text-white" : "border-[#D5DDD8] bg-white text-[#3B4A41]")}
                  style={sel ? { background: stageColor(settings, k) } : undefined}>
                  {!sel && <span className="size-2 rounded-full" style={{ background: stageColor(settings, k) }} aria-hidden />}
                  {stageLabel(settings, k)}<span className={cn("text-xs", sel ? "text-white/90" : "text-[#7A867F]")}>{loading ? "" : byStage(k).length}</span>
                </button>
              );
            })}
          </div>
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragId(null)}>
            <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
              className="md:-mx-1 md:grid md:auto-cols-[minmax(188px,1fr)] md:grid-flow-col md:gap-3 md:overflow-x-auto md:px-1 md:pt-1 md:pb-3">
              {STAGE_ORDER.map(k => {
                const list = byStage(k);
                return (
                  <ProjectColumn key={k} ref={el => { colRefs.current[k] = el; }} stage={k} label={stageLabel(settings, k)} color={stageColor(settings, k)}
                    count={list.length} highlight={highlight === k} loading={loading} className={mobileStage === k ? "" : "max-md:hidden"}>
                    {loading ? [0, 1].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-white/70" />)
                      : list.length === 0 ? <p className="rounded-xl border border-dashed border-[#D5DDD8] px-3 py-6 text-center text-sm text-[#7A867F]">{query || assignee !== "all" ? "조건에 맞는 의뢰 없음" : "이 단계의 의뢰 없음"}</p>
                        : list.map(p => <ProjectCard key={p.id} {...cardProps(p)} />)}
                  </ProjectColumn>
                );
              })}
            </div>
            <DragOverlay dropAnimation={null}>
              {dragProject ? <div className="w-[220px]"><ProjectCardPreview {...cardProps(dragProject)} /></div> : null}
            </DragOverlay>
          </DndContext>
          <p className="mt-2 hidden text-xs text-[#7A867F] md:block">키보드로는 카드의 ⋮ 메뉴에서 “단계 변경”을 고를 수 있어요.</p>
          <p className="mt-1 text-xs text-[#7A867F] md:hidden">좌우로 밀어 단계를 바꿔 보거나, 카드의 ⋮ 메뉴에서 단계를 옮길 수 있어요.</p>
        </>
      )}

      <ConfirmDialog open={!!pending} onOpenChange={o => { if (!o) setPending(null); }}
        title={pending ? skipConfirmTitle(settings, pending.project.stage, pending.to) : ""}
        description={pending ? `‘${pending.project.title}’을(를) 옮기고 건너뛴 단계를 활동 기록에 남겨요.` : undefined}
        confirmLabel="옮기기" onConfirm={async () => { if (pending) await doMove(pending.project, pending.to); }} />
      <NewProjectDialog open={isNew} onOpenChange={o => { if (!o) go({ new: null }); }} onCreated={p => go({ new: null, id: p.id })} />
      {detailId && <ProjectDetail projectId={detailId} onClose={() => go({ id: null })} />}
    </>
  );
}
