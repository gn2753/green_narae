import type { Activity, AdminId, Priority, Project, Settings, StageKey, StageRecord, Task, TaskCategory, TaskStatus } from "@/domain/types";
import { ADMINS, STAGE_ORDER, stageLabel } from "@/domain/defaults";
import { CUSTOMER_TABLE, customerId } from "./people";
import { base, image, pad, pfImage, type SeedCtx } from "./util";

interface ProjectSpec {
  customer: number; stage: StageKey; title: string; created: number; due?: number;
  inquiryId?: string; siteAddress?: boolean;
  waiting?: { reason: string; since: number; expected?: number };
}
/** 단계 분포: 상담·실측 2 · 견적 3 · 디자인 3 · 시공·납품 2 · 정산·완료 2 / 대기 2 / 지연 2(p06, p09) */
const PROJECTS: ProjectSpec[] = [
  { customer: 1, stage: "measure", title: "온담카페 채널간판 교체", created: -3, due: 20, inquiryId: "q05", siteAddress: true },
  { customer: 2, stage: "measure", title: "해봄수학 돌출간판 신규", created: -5, due: 25, inquiryId: "q06", siteAddress: true },
  { customer: 3, stage: "quote", title: "밝은내과 실내 안내사인", created: -8, due: 30, inquiryId: "q07" },
  { customer: 4, stage: "quote", title: "할매국수 어닝 교체", created: -11, due: 18, waiting: { reason: "고객 회신", since: -3, expected: 2 } },
  { customer: 5, stage: "quote", title: "BAR1984 네온사인 제작", created: -9, due: 22, siteAddress: true },
  { customer: 6, stage: "design", title: "꽃길플라워 채널간판", created: -16, due: -2 },
  { customer: 7, stage: "design", title: "숲속키즈 실내사인", created: -21, due: 10, waiting: { reason: "시안 확정", since: -2, expected: 3 } },
  { customer: 8, stage: "design", title: "24편의점 돌출간판 교체", created: -14, due: 12, siteAddress: true },
  { customer: 9, stage: "install", title: "초록정육 어닝·실사 시공", created: -27, due: -1, siteAddress: true },
  { customer: 10, stage: "install", title: "불맛치킨 채널간판", created: -20, due: 4 },
  { customer: 11, stage: "settle", title: "온기베이커리 채널간판", created: -42, due: 5 },
  { customer: 12, stage: "settle", title: "모아안경 LED 사인", created: -52, due: 7, siteAddress: true },
];
export const projectId = (n: number) => `p${pad(n)}`;
/** 의뢰 번호 → 고객 번호 */
export const projectCustomer = (n: number) => PROJECTS[n - 1].customer;

function stageRecords(ctx: SeedCtx, n: number, spec: ProjectSpec): Partial<Record<StageKey, StageRecord>> {
  const r: Partial<Record<StageKey, StageRecord>> = {};
  const idx = STAGE_ORDER.indexOf(spec.stage);
  const c = spec.customer;
  const id = projectId(n);
  if (n === 1) r.measure = { fields: { measuredAt: ctx.day(2), sizeMemo: "", memo: "실측 예정 — 기존 간판 철거 여부 확인" }, attachments: [] };
  if (idx >= 1 || n === 2) {
    r.measure = { fields: { measuredAt: ctx.day(spec.created + 2), sizeMemo: `전면 ${(5 + (n % 4) * 0.7).toFixed(1)}m × 0.9m`, memo: n % 2 ? "전기 인입 위치 확인 완료" : "건물주 허가서 사본 받음" }, attachments: [] };
  }
  if (idx >= 2) {
    const versions = [1, 2].slice(0, n === 7 || idx >= 3 ? 2 : 1).map(no => ({
      no, note: no === 1 ? "1차 시안" : "색상 수정 반영 2차 시안",
      attachments: [image(`${id}-d${no}`, pfImage(c, 1), `${no}차 시안.svg`, "kim", ctx.at(spec.created + 5 + no * 2, 15, 0))],
      confirmed: idx >= 3 && no === 2,
    }));
    r.design = { fields: {}, attachments: [], designVersions: versions };
  }
  if (idx >= 3) {
    const installed = idx >= 4;
    r.install = {
      fields: { installedOn: installed ? ctx.day(spec.created + 20) : ctx.day(n === 9 ? 1 : 3), memo: installed ? "시공 완료, 점등 확인" : "고소작업차 예약 필요" },
      attachments: installed
        ? [image(`${id}-i1`, pfImage(c, 2), "시공 후 사진(야간).svg", "choi", ctx.at(spec.created + 20, 19, 0)), image(`${id}-i2`, pfImage(c, 3), "시공 후 사진(근접).svg", "choi", ctx.at(spec.created + 20, 19, 5))]
        : [image(`${id}-i0`, pfImage(c, 1), "현장 사진.svg", "choi", ctx.at(spec.created + 2, 11, 0))],
    };
  }
  if (idx >= 4) r.settle = { fields: { memo: "세금계산서 발행 완료" }, attachments: [] };
  return r;
}

export function buildProjectsAndActivities(ctx: SeedCtx, settings: Settings): { projects: Project[]; activities: Activity[] } {
  const projects: Project[] = []; const activities: Activity[] = [];
  const def = (k: StageKey) => settings.stages.find(s => s.key === k)?.defaultAssigneeId ?? null;
  let a = 0;
  const act = (projectIdValue: string, at: string, actorId: AdminId | "web", type: Activity["type"], message: string) => {
    activities.push({ ...base(`a${pad(++a, 3)}`, at), projectId: projectIdValue, actorId, type, message });
    return at;
  };
  PROJECTS.forEach((spec, i) => {
    const n = i + 1; const id = projectId(n);
    const created = ctx.at(spec.created, 10 + (n % 5), 15);
    const idx = STAGE_ORDER.indexOf(spec.stage);
    // 활동 2~4개: 등록 + 최근 단계 이동(최대 3, 대기 있으면 2) + (상담·실측이면 메모) + (대기 표시)
    let last = act(id, created, "kim", "create", spec.inquiryId ? "문의에서 의뢰 시작" : "의뢰 등록");
    const moves = Math.min(idx, spec.waiting ? 2 : 3);
    const span = Math.max(1, -spec.created - 1);
    for (let m = idx - moves; m < idx; m++) {
      const off = spec.created + Math.round((span * (m + 1)) / (idx + 1));
      const from = STAGE_ORDER[m], to = STAGE_ORDER[m + 1];
      last = act(id, ctx.at(off, 16, 30), def(from) ?? "kim", "stage", `${stageLabel(settings, from)} → ${stageLabel(settings, to)} 단계로 이동`);
    }
    if (idx === 0) last = act(id, ctx.at(spec.created + 1, 11, 0), "choi", "note", "고객과 통화, 실측 일정 조율");
    if (spec.waiting) last = act(id, ctx.at(spec.waiting.since, 17, 0), "kim", "waiting", `대기 표시: ${spec.waiting.reason}${spec.waiting.expected !== undefined ? ` (예상 ${ctx.day(spec.waiting.expected)})` : ""}`);
    projects.push({
      ...base(id, created, last),
      title: spec.title, signType: CUSTOMER_TABLE[spec.customer - 1][2], customerId: customerId(spec.customer), inquiryId: spec.inquiryId ?? null,
      ...(spec.siteAddress ? { siteAddress: CUSTOMER_TABLE[spec.customer - 1][3] } : {}),
      stage: spec.stage, assigneeId: def(spec.stage),
      ...(spec.due !== undefined ? { dueDate: ctx.day(spec.due) } : {}),
      status: "active",
      waiting: spec.waiting ? { reason: spec.waiting.reason, since: ctx.at(spec.waiting.since, 17, 0), ...(spec.waiting.expected !== undefined ? { expectedDate: ctx.day(spec.waiting.expected) } : {}) } : null,
      stageRecords: stageRecords(ctx, n, spec),
      taxInvoiceIssued: idx >= 4,
    });
  });
  return { projects, activities };
}

type TaskSpec = [title: string, category: TaskCategory, assigneeId: AdminId | null, priority: Priority, work: number, due: number, status: TaskStatus, project?: number, extra?: { customer?: number; designDone?: number; meetingDone?: number }];
/** 26건: 6파트 모두 · 김 14 / 최 12 · 오늘 일정 7 · 지연 3 · 긴급 2 · 완료 4(디자인 완료 인계 1 포함) */
const TASKS: TaskSpec[] = [
  ["꽃길플라워 채널간판 시안 수정", "design", "kim", "high", -1, -1, "in_progress", 6],
  ["숲속키즈 실내사인 2차 시안", "design", "kim", "normal", 0, 2, "review", 7],
  ["24편의점 돌출간판 시안 작업", "design", "kim", "normal", 1, 3, "todo", 8],
  ["모아안경 출력 데이터 정리", "design", "kim", "low", 2, 5, "todo", 12],
  ["해봄수학 로고 벡터 작업", "design", "kim", "normal", -1, 1, "in_progress", 2],
  ["할매국수 어닝 실사 출력 파일", "design", "kim", "normal", 1, 4, "todo", 4],
  ["온담카페 현장 실측", "meeting", "choi", "high", 2, 2, "todo", 1],
  ["해봄수학 실측 결과 정리", "meeting", "choi", "normal", 0, 0, "in_progress", 2],
  ["세종○○약국 방문 상담", "meeting", "choi", "normal", 1, 1, "todo", undefined, { customer: 13 }],
  ["밝은내과 현장 실측", "meeting", "choi", "normal", -6, -6, "done", 3, { meetingDone: -6 }],
  ["초록정육 어닝 시공", "owner", "choi", "urgent", -1, -1, "in_progress", 9],
  ["불맛치킨 채널간판 설치", "owner", "choi", "high", 3, 4, "todo", 10],
  ["온기베이커리 간판 납품 확인", "owner", "choi", "normal", -8, -6, "done", 11, { designDone: -12 }],
  ["고소작업차 일정 확정", "owner", "choi", "normal", 0, 1, "todo"],
  ["모아안경 LED 점등 점검", "owner", "choi", "normal", 4, 6, "todo", 12],
  ["밝은내과 견적서 작성", "estimate", "kim", "high", 0, 0, "in_progress", 3],
  ["BAR1984 네온 견적 검토", "estimate", "kim", "urgent", 0, 1, "todo", 5],
  ["할매국수 어닝 견적 재발송", "estimate", "kim", "normal", -4, -3, "todo", 4],
  ["꽃길플라워 견적 확정", "estimate", "kim", "normal", -14, -13, "done", 6],
  ["숲속키즈 시안 확정 회신 대기", "waiting", "kim", "normal", 1, 4, "todo", 7],
  ["할매국수 고객 회신 대기", "waiting", "choi", "low", 2, 6, "todo", 4],
  ["LED 모듈 입고 대기", "waiting", "choi", "normal", 3, 5, "todo"],
  ["9월 세금계산서 발행", "admin", "kim", "high", 0, 2, "todo"],
  ["모아안경 잔금 안내 문자", "admin", "kim", "normal", 0, 0, "todo", 12],
  ["차량 보험 갱신 서류", "admin", "choi", "low", 5, 9, "todo"],
  ["온기베이커리 정산 서류 정리", "admin", "kim", "normal", -5, -4, "done", 11],
];

export function buildTasks(ctx: SeedCtx): Task[] {
  return TASKS.map(([title, category, assigneeId, priority, work, due, status, project, extra], i) => {
    const created = ctx.at(Math.min(work, 0) - 2 - (i % 3), 9, (i * 11) % 60);
    const completedAt = status === "done" ? ctx.at(due, 17, 30) : null;
    const customer = project ? projectCustomer(project) : extra?.customer;
    return {
      ...base(`t${pad(i + 1)}`, created, completedAt ?? created),
      title, category, assignee: assigneeId ? ADMINS[assigneeId].name : "미지정", assigneeId, priority,
      workDate: ctx.day(work), dueDate: ctx.day(due), status, completedAt,
      designCompletedAt: extra?.designDone !== undefined ? ctx.at(extra.designDone, 18, 0) : null,
      meetingCompletedAt: extra?.meetingDone !== undefined ? ctx.at(extra.meetingDone, 15, 0) : null,
      projectId: project ? projectId(project) : null,
      customerId: customer ? customerId(customer) : null,
    };
  });
}
