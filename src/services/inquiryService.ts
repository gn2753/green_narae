import type { Repository } from "@/data/repository";
import type { AdminId, Customer, Inquiry, InquiryForm, InquirySource, ISODate, Project, ReplyChannel } from "@/domain/types";
import { addReply, findCustomerByPhone, inquiryFormSchema } from "@/domain/inquiries";
import { REPLY_CHANNEL_LABEL } from "@/domain/defaults";
import { NotFoundError } from "@/data/errors";
import { createProject, log } from "./projectService";

async function load(repo: Repository, id: string) { const q = await repo.get("inquiries", id); if (!q) throw new NotFoundError("문의"); return q; }

/** 홈페이지 문의 접수 → A09 미답변 + NEW */
export async function submitWebInquiry(repo: Repository, form: InquiryForm): Promise<Inquiry> {
  const f = inquiryFormSchema.parse(form);
  return repo.create("inquiries", {
    name: f.name, phone: f.phone, email: f.email, message: f.message,
    source: "web", status: "open", isNew: true, assigneeId: null, customerId: null, projectId: null, replies: [],
  });
}

/** 전화·카톡·방문·메일 문의 수기 등록 */
export async function createManualInquiry(repo: Repository, input: { name: string; phone: string; email?: string; message: string; source: InquirySource }, actorId: AdminId): Promise<Inquiry> {
  const name = input.name.trim(), phone = input.phone.trim(), message = input.message.trim(), email = input.email?.trim();
  if (!name) throw new Error("이름을 입력해주세요.");
  if (!phone) throw new Error("연락처를 입력해주세요.");
  if (!message) throw new Error("문의 내용을 입력해주세요.");
  return repo.create("inquiries", {
    name, phone, ...(email ? { email } : {}), message, source: input.source,
    status: "open", isNew: false, assigneeId: actorId, customerId: null, projectId: null, replies: [],
  });
}

/** 답변 기록 → 자동 답변완료(종료 문의는 유지) */
export async function replyToInquiry(repo: Repository, inquiryId: string, reply: { channel: ReplyChannel; message: string }, actorId: AdminId): Promise<Inquiry> {
  const message = reply.message.trim(); if (!message) throw new Error("답변 내용을 입력해주세요.");
  const q = await load(repo, inquiryId);
  const id = globalThis.crypto?.randomUUID?.() ?? `r-${q.replies.length + 1}-${q.id}`;
  const next = addReply(q, { at: new Date().toISOString(), by: actorId, channel: reply.channel, message }, id);
  const saved = await repo.update("inquiries", inquiryId, { replies: next.replies, status: next.status, isNew: next.isNew }, q.version);
  if (saved.projectId) await log(repo, saved.projectId, actorId, "note", `문의 답변 기록(${REPLY_CHANNEL_LABEL[reply.channel]}): ${message}`);
  return saved;
}

export async function assignInquiry(repo: Repository, inquiryId: string, assigneeId: AdminId | null): Promise<Inquiry> {
  const q = await load(repo, inquiryId);
  return repo.update("inquiries", inquiryId, { assigneeId, isNew: false }, q.version);
}

/** 종료(스팸·불발) */
export async function closeInquiry(repo: Repository, inquiryId: string): Promise<Inquiry> {
  const q = await load(repo, inquiryId);
  return repo.update("inquiries", inquiryId, { status: "closed", isNew: false }, q.version);
}

/** 보관함에서 종료된 문의를 다시 연다(미답변 상태로) */
export async function reopenInquiry(repo: Repository, inquiryId: string): Promise<Inquiry> {
  const q = await load(repo, inquiryId);
  return repo.update("inquiries", inquiryId, { status: "open", isNew: false }, q.version);
}

/** 상세를 열면 NEW 표시 해제 */
export async function markInquirySeen(repo: Repository, inquiryId: string): Promise<Inquiry> {
  const q = await load(repo, inquiryId);
  return q.isNew ? repo.update("inquiries", inquiryId, { isNew: false }, q.version) : q;
}

export interface StartProjectInput {
  customerId?: string;
  newCustomer?: { name: string; company?: string; phone: string; email?: string; site?: string };
  title: string; signType: string; dueDate?: ISODate;
}
/** 고객 등록(또는 연결) + 의뢰 시작(상담·실측) → 문의에 고객·의뢰 연결 */
export async function startProjectFromInquiry(repo: Repository, inquiryId: string, input: StartProjectInput, actorId: AdminId): Promise<{ customer: Customer; project: Project }> {
  const q = await load(repo, inquiryId);
  if (q.projectId) throw new Error("이미 의뢰가 시작된 문의입니다.");
  let customer: Customer | null = null;
  if (input.customerId) {
    customer = await repo.get("customers", input.customerId);
    if (!customer) throw new NotFoundError("고객");
  } else {
    const nc = input.newCustomer ?? { name: q.name, phone: q.phone, email: q.email };
    if (!nc.name.trim() || !nc.phone.trim()) throw new Error("고객 이름과 연락처를 입력해주세요.");
    customer = findCustomerByPhone(await repo.list("customers"), nc.phone);
    if (!customer) {
      customer = await repo.create("customers", {
        name: nc.name.trim(), phone: nc.phone.trim(),
        ...(nc.company?.trim() ? { company: nc.company.trim() } : {}),
        ...(nc.email?.trim() ? { email: nc.email.trim() } : {}),
        sites: nc.site?.trim() ? [nc.site.trim()] : [],
      });
    }
  }
  const site = input.newCustomer?.site?.trim();
  const project = await createProject(repo, { customerId: customer.id, title: input.title, signType: input.signType, dueDate: input.dueDate, ...(site ? { siteAddress: site } : {}), inquiryId: q.id }, actorId);
  const latest = await load(repo, inquiryId);
  await repo.update("inquiries", inquiryId, { customerId: customer.id, projectId: project.id, status: latest.status === "closed" ? "closed" : "answered", isNew: false }, latest.version);
  return { customer, project };
}
