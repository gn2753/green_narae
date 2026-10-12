import type { Repository } from "@/data/repository";
import type { ActivityType, AdminId, Customer, ISODate, Project, StageKey, StageRecord, Waiting } from "@/domain/types";
import { describeProjectEdit, moveProjectStage, setProjectWaiting, type ProjectFieldsPatch } from "@/domain/projects";
import { findCustomerByPhone } from "@/domain/inquiries";
import { isValidISODate } from "@/domain/dates";
import { NotFoundError } from "@/data/errors";

async function load(repo: Repository, id: string) { const p = await repo.get("projects", id); if (!p) throw new NotFoundError("의뢰"); return p; }

/** 의뢰 활동 기록(createdAt = 발생 시각) */
export async function log(repo: Repository, projectId: string, actorId: AdminId | "web", type: ActivityType, message: string) {
  return repo.create("activities", { projectId, actorId, type, message });
}

export async function moveStage(repo: Repository, id: string, to: StageKey, expectedVersion: number, actorId: AdminId): Promise<Project> {
  const p = await load(repo, id); const settings = await repo.getSettings();
  const { project, message } = moveProjectStage(p, to, { now: new Date().toISOString(), actorId, settings });
  const saved = await repo.update("projects", id, { stage: project.stage, assigneeId: project.assigneeId }, expectedVersion);
  await log(repo, id, actorId, "stage", message); return saved;
}

export async function setWaiting(repo: Repository, id: string, w: Omit<Waiting, "since"> | null, expectedVersion: number, actorId: AdminId): Promise<Project> {
  const p = await load(repo, id); const settings = await repo.getSettings();
  const { project, message } = setProjectWaiting(p, w, { now: new Date().toISOString(), actorId, settings });
  const saved = await repo.update("projects", id, { waiting: project.waiting }, expectedVersion);
  await log(repo, id, actorId, "waiting", message); return saved;
}

/** 단계 기록 저장. message를 주면 활동 기록 문구로 쓴다(기본 "단계 기록 수정"). */
export async function updateStageRecord(repo: Repository, id: string, stage: StageKey, record: StageRecord, expectedVersion: number, actorId: AdminId, message = "단계 기록 수정", type: ActivityType = "edit"): Promise<Project> {
  const p = await load(repo, id);
  const saved = await repo.update("projects", id, { stageRecords: { ...p.stageRecords, [stage]: record } }, expectedVersion);
  await log(repo, id, actorId, type, message); return saved;
}

/** 의뢰 기본 정보 인라인 수정(건명·종류·주소·담당자·마감일·세금계산서). 바뀐 항목만 저장하고 "edit" 활동을 남긴다. 바뀐 게 없으면 그대로 돌려준다. */
export async function updateProjectFields(repo: Repository, id: string, patch: ProjectFieldsPatch, expectedVersion: number, actorId: AdminId): Promise<Project> {
  const p = await load(repo, id);
  if (patch.title !== undefined && !patch.title.trim()) throw new Error("건명을 입력해주세요.");
  if (patch.signType !== undefined && !patch.signType.trim()) throw new Error("간판 종류를 선택해주세요.");
  if (patch.dueDate && !isValidISODate(patch.dueDate)) throw new Error("마감일은 2000-01-01 ~ 2100-12-31 사이의 날짜로 입력해주세요.");
  const { changes, message } = describeProjectEdit(p, patch);
  if (!message) return p;
  const saved = await repo.update("projects", id, changes, expectedVersion);
  await log(repo, id, actorId, "edit", message); return saved;
}

export async function addProjectNote(repo: Repository, id: string, message: string, actorId: AdminId) {
  const text = message.trim(); if (!text) throw new Error("메모 내용을 입력해주세요.");
  await load(repo, id);
  return log(repo, id, actorId, "note", text);
}

export async function closeProject(repo: Repository, id: string, kind: "done" | "closed", actorId: AdminId): Promise<Project> {
  const p = await load(repo, id); const saved = await repo.update("projects", id, { status: kind }, p.version);
  await log(repo, id, actorId, "edit", kind === "done" ? "완료 처리 (보관함으로 이동)" : "종료 처리 (보관함으로 이동)"); return saved;
}

export async function restoreProject(repo: Repository, id: string, actorId: AdminId): Promise<Project> {
  const p = await load(repo, id); const saved = await repo.update("projects", id, { status: "active" }, p.version);
  await log(repo, id, actorId, "edit", "보관함에서 복원"); return saved;
}

export interface CreateProjectInput {
  customerId: string; title: string; signType: string; siteAddress?: string; dueDate?: ISODate; stage?: StageKey; inquiryId?: string | null;
}
export async function createProject(repo: Repository, input: CreateProjectInput, actorId: AdminId): Promise<Project> {
  const title = input.title.trim(), signType = input.signType.trim();
  if (!title) throw new Error("건명을 입력해주세요.");
  if (!signType) throw new Error("간판 종류를 선택해주세요.");
  if (!(await repo.get("customers", input.customerId))) throw new NotFoundError("고객");
  const settings = await repo.getSettings(); const stage = input.stage ?? "measure";
  const p = await repo.create("projects", {
    title, signType, customerId: input.customerId, inquiryId: input.inquiryId ?? null,
    ...(input.siteAddress ? { siteAddress: input.siteAddress } : {}),
    stage, assigneeId: settings.stages.find(s => s.key === stage)?.defaultAssigneeId ?? null,
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    status: "active", waiting: null, stageRecords: {}, taxInvoiceIssued: false,
  });
  await log(repo, p.id, actorId, "create", input.inquiryId ? "문의에서 의뢰 시작" : "의뢰 등록"); return p;
}

export interface NewCustomerInput { name: string; company?: string; phone: string; site?: string }
/** 새 의뢰: 기존 고객(customerId) 또는 새 고객(같은 연락처 고객이 있으면 그 고객에 연결) + 의뢰 생성 */
export async function createProjectWithCustomer(
  repo: Repository, input: Omit<CreateProjectInput, "customerId" | "inquiryId"> & { customerId?: string; newCustomer?: NewCustomerInput }, actorId: AdminId,
): Promise<{ customer: Customer; project: Project; reusedCustomer: boolean }> {
  let customer: Customer | null = null; let reusedCustomer = false;
  if (input.customerId) {
    customer = await repo.get("customers", input.customerId);
    if (!customer) throw new NotFoundError("고객");
  } else {
    const nc = input.newCustomer;
    if (!nc || !nc.name.trim() || !nc.phone.trim()) throw new Error("고객 이름과 연락처를 입력해주세요.");
    if (!input.title.trim()) throw new Error("건명을 입력해주세요.");
    if (!input.signType.trim()) throw new Error("간판 종류를 선택해주세요.");
    customer = findCustomerByPhone(await repo.list("customers"), nc.phone);
    if (customer) reusedCustomer = true;
    else {
      customer = await repo.create("customers", {
        name: nc.name.trim(), phone: nc.phone.trim(),
        ...(nc.company?.trim() ? { company: nc.company.trim() } : {}),
        sites: nc.site?.trim() ? [nc.site.trim()] : [],
      });
    }
  }
  const project = await createProject(repo, { title: input.title, signType: input.signType, siteAddress: input.siteAddress, dueDate: input.dueDate, stage: input.stage, customerId: customer.id }, actorId);
  return { customer, project, reusedCustomer };
}
