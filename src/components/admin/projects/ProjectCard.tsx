"use client";
import { useDraggable } from "@dnd-kit/core";
import { CalendarDays, Check, EllipsisVertical, Hourglass, TriangleAlert, UserRound } from "lucide-react";
import { STAGE_ORDER, stageColor, stageLabel } from "@/domain/defaults";
import { overdueDays, waitingDays } from "@/domain/projects";
import type { Customer, ISODate, Project, Settings, StageKey } from "@/domain/types";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** 대기 경과: 표시한 날은 "오늘부터", 이후 "N일째" */
export const waitingText = (days: number | null) => (!days ? "오늘부터" : `${days}일째`);
export const shortDate = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8))}일`;

export interface ProjectCardProps {
  project: Project; customer?: Customer; settings: Settings; today: ISODate;
  progress: { done: number; total: number };
  onOpen: (p: Project) => void; onMove: (p: Project, to: StageKey) => void;
  /** ≥768px에서만 끌어 옮기기 */
  dragEnabled: boolean;
  /** 끌고 있는 카드의 겉모양(메뉴 숨김) — ProjectCardPreview 전용 */
  overlay?: boolean;
  busy?: boolean;
}

/** 보드 카드 내용(끌기와 분리해 DragOverlay에서도 쓴다). */
function CardBody({ project: p, customer, settings, today, progress, onOpen, onMove, busy, overlay }: Omit<ProjectCardProps, "dragEnabled">) {
  const late = overdueDays(p, today);
  const wDays = waitingDays(p, today);
  return (
    <>
      <div className="flex items-start gap-1">
        <button type="button" onClick={() => onOpen(p)} className="min-h-11 min-w-0 flex-1 py-1 text-left md:min-h-0" aria-label={`${p.title} 상세 열기`}>
          <span className="block text-[15px] leading-snug font-bold break-words text-[#1F2A24]">{p.title}</span>
          <span className="mt-0.5 block truncate text-xs text-[#5F6B64]">{p.signType} · {customer ? `${customer.name}${customer.company ? ` (${customer.company})` : ""}` : "고객 정보 없음"}</span>
        </button>
        {!overlay && (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`${p.title} 메뉴`} disabled={busy}
              className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#56645C] hover:bg-[#EEF1EF] disabled:opacity-50 md:size-9"
              onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
              <EllipsisVertical className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="min-h-10" onClick={() => onOpen(p)}>상세 보기</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>단계 변경</DropdownMenuLabel>
                {STAGE_ORDER.map(k => (
                  <DropdownMenuItem key={k} className="min-h-10" disabled={k === p.stage} onClick={() => onMove(p, k)}>
                    <span className="size-2.5 rounded-full" style={{ background: stageColor(settings, k) }} aria-hidden />
                    {stageLabel(settings, k)}{k === p.stage && <Check className="ml-auto size-4" aria-label="현재 단계" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {p.waiting && (
        <p className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-[#FFF4D6] px-2 py-0.5 text-xs font-medium text-[#8A6400]">
          <Hourglass className="size-3 shrink-0" aria-hidden /><span className="truncate">{p.waiting.reason} · {waitingText(wDays)}</span>
        </p>
      )}
      {progress.total > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-[#5F6B64]"><span>연결 업무</span><span>{progress.done}/{progress.total}</span></div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#EEF1EF]" role="progressbar" aria-label="연결 업무 진행" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {p.dueDate ? (
          late > 0
            ? <span className="inline-flex items-center gap-1 font-bold text-[#B42323]"><TriangleAlert className="size-3.5" aria-hidden />{late}일 지연</span>
            : <span className="inline-flex items-center gap-1 text-[#56645C]"><CalendarDays className="size-3.5" aria-hidden />{p.dueDate === today ? "오늘 마감" : `${shortDate(p.dueDate)} 마감`}</span>
        ) : <span className="text-[#9AA59F]">마감일 없음</span>}
        {p.assigneeId ? <AdminAvatar id={p.assigneeId} size="sm" /> : <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#EEF1EF] text-[#7A867F]" title="담당자 미지정"><UserRound className="size-3.5" aria-label="담당자 미지정" /></span>}
      </div>
    </>
  );
}

const cardCls = (late: boolean) => cn("rounded-xl border bg-white p-3 shadow-[0_1px_0_rgba(31,42,36,0.04)]", late ? "border-[#F0B7B7]" : "border-[#E3E8E4]");

/** 끌고 있는 카드의 겉모양(DragOverlay용). useDraggable을 부르지 않는다 — 같은 id로 부르면 진짜 카드의 등록을 덮어쓰고 지워 다음 끌기가 깨진다. */
export function ProjectCardPreview(props: Omit<ProjectCardProps, "dragEnabled" | "overlay">) {
  return (
    <article className={cn(cardCls(overdueDays(props.project, props.today) > 0), "rotate-1 cursor-grabbing shadow-lg ring-2 ring-brand/40")}>
      <CardBody {...props} overlay />
    </article>
  );
}

/** 의뢰 진행 보드 카드. ≥768px에서는 끌어서 다른 단계 열에 놓을 수 있다(키보드·터치는 메뉴의 단계 변경). */
export function ProjectCard(props: Omit<ProjectCardProps, "overlay">) {
  const { project: p, today, dragEnabled } = props;
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: p.id, data: { stage: p.stage }, disabled: !dragEnabled });
  // 키보드 끌기는 쓰지 않는다(메뉴로 대신) → role/tabIndex 속성(attributes)은 붙이지 않고 포인터 리스너만 쓴다.
  const onPointerDown = dragEnabled ? (listeners?.onPointerDown as React.PointerEventHandler<HTMLElement> | undefined) : undefined;
  return (
    <article ref={setNodeRef} onPointerDown={onPointerDown} data-project-id={p.id}
      className={cn(cardCls(overdueDays(p, today) > 0), dragEnabled && "md:cursor-grab", isDragging && "opacity-40")}>
      <CardBody {...props} />
    </article>
  );
}
