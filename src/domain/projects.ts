import type { AdminId, ISODate, ISOTime, Project, Settings, StageKey, Waiting } from "./types";
import { ADMINS, STAGE_ORDER, stageLabel } from "./defaults";
import { daysBetween, koreaDate } from "./dates";

export type Ctx = { now: ISOTime; actorId: AdminId; settings: Settings };

export function skippedStages(from: StageKey, to: StageKey): StageKey[] {
  const a = STAGE_ORDER.indexOf(from), b = STAGE_ORDER.indexOf(to);
  return b > a + 1 ? STAGE_ORDER.slice(a + 1, b) : [];
}

export function moveProjectStage(p: Project, to: StageKey, ctx: Ctx) {
  const def = (k: StageKey) => ctx.settings.stages.find(s => s.key === k)?.defaultAssigneeId ?? null;
  const reassign = p.assigneeId === null || p.assigneeId === def(p.stage);
  const skipped = skippedStages(p.stage, to);
  const project: Project = { ...p, stage: to, assigneeId: reassign ? def(to) : p.assigneeId, updatedAt: ctx.now };
  const message = `${stageLabel(ctx.settings, p.stage)} → ${stageLabel(ctx.settings, to)} 단계로 이동`
    + (skipped.length ? ` (건너뜀: ${skipped.map(k => stageLabel(ctx.settings, k)).join(", ")})` : "");
  return { project, message };
}

export function setProjectWaiting(p: Project, w: Omit<Waiting, "since"> | null, ctx: Ctx) {
  const waiting: Waiting | null = w ? { ...w, since: ctx.now } : null;
  const message = w ? `대기 표시: ${w.reason}${w.expectedDate ? ` (예상 ${w.expectedDate})` : ""}` : `대기 해제${p.waiting ? `: ${p.waiting.reason}` : ""}`;
  return { project: { ...p, waiting, updatedAt: ctx.now }, message };
}

export function waitingDays(p: Project, today: ISODate): number | null {
  return p.waiting ? daysBetween(koreaDate(new Date(p.waiting.since)), today) : null;
}
export function isProjectOverdue(p: Project, today: ISODate) { return p.status === "active" && !!p.dueDate && p.dueDate < today; }

export interface ProjectFieldsPatch {
  title?: string; signType?: string; siteAddress?: string; assigneeId?: AdminId | null; dueDate?: ISODate | ""; taxInvoiceIssued?: boolean;
}

/** 인라인 수정 패치 → 실제로 바뀐 값만 + 활동 문구("담당자 변경: 김자연 → 최관웅" 등, 여러 개는 " · "로 연결). 빈 문자열은 지움. */
export function describeProjectEdit(p: Project, patch: ProjectFieldsPatch): { changes: Partial<Project>; message: string } {
  const changes: Partial<Project> = {}; const parts: string[] = [];
  const who = (id: AdminId | null | undefined) => (id ? ADMINS[id].name : "미지정");
  if (patch.title !== undefined && patch.title.trim() !== p.title) { changes.title = patch.title.trim(); parts.push(`건명 변경: ${p.title} → ${changes.title}`); }
  if (patch.signType !== undefined && patch.signType.trim() !== p.signType) { changes.signType = patch.signType.trim(); parts.push(`간판 종류 변경: ${p.signType} → ${changes.signType}`); }
  if (patch.siteAddress !== undefined && patch.siteAddress.trim() !== (p.siteAddress ?? "")) {
    const v = patch.siteAddress.trim(); changes.siteAddress = v || undefined; parts.push(v ? `현장 주소 변경: ${v}` : "현장 주소 삭제");
  }
  if (patch.assigneeId !== undefined && patch.assigneeId !== p.assigneeId) { changes.assigneeId = patch.assigneeId; parts.push(`담당자 변경: ${who(p.assigneeId)} → ${who(patch.assigneeId)}`); }
  if (patch.dueDate !== undefined && patch.dueDate !== (p.dueDate ?? "")) {
    changes.dueDate = patch.dueDate || undefined; parts.push(patch.dueDate ? `마감일 변경: ${p.dueDate ?? "없음"} → ${patch.dueDate}` : "마감일 삭제");
  }
  if (patch.taxInvoiceIssued !== undefined && patch.taxInvoiceIssued !== p.taxInvoiceIssued) { changes.taxInvoiceIssued = patch.taxInvoiceIssued; parts.push(patch.taxInvoiceIssued ? "세금계산서 발행 표시" : "세금계산서 발행 해제"); }
  return { changes, message: parts.join(" · ") };
}

/** 보드 열 안 정렬: 지연 → 마감일(없으면 뒤) → 등록순 */
export function compareBoardProjects(a: Project, b: Project, today: ISODate): number {
  const oa = isProjectOverdue(a, today) ? 0 : 1, ob = isProjectOverdue(b, today) ? 0 : 1;
  if (oa !== ob) return oa - ob;
  const da = a.dueDate ?? "9999-12-31", db = b.dueDate ?? "9999-12-31";
  if (da !== db) return da < db ? -1 : 1;
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

/** 지연 일수(지연이 아니면 0) */
export function overdueDays(p: Project, today: ISODate): number { return isProjectOverdue(p, today) && p.dueDate ? daysBetween(p.dueDate, today) : 0; }

/** 건너뛰기 확인 문구: "견적·디자인 단계를 건너뛰고 시공·납품으로 옮길까요?" */
export function skipConfirmTitle(settings: Settings, from: StageKey, to: StageKey): string {
  const skipped = skippedStages(from, to);
  const target = stageLabel(settings, to);
  return `${skipped.map(k => stageLabel(settings, k)).join("·")} 단계를 건너뛰고 ${target}${hasBatchim(target) ? "으로" : "로"} 옮길까요?`;
}
function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0 && c % 28 !== 8; // ㄹ 받침은 "로"
}
