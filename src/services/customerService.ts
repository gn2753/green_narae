import type { Repository } from "@/data/repository";
import type { AdminId, Customer } from "@/domain/types";
import { inquiryFormSchema } from "@/domain/inquiries";
import { formatMemoLine } from "@/domain/customers";
import { ADMINS } from "@/domain/defaults";
import { koreaDate } from "@/domain/dates";
import { NotFoundError } from "@/data/errors";
import { addProjectNote } from "./projectService";

export interface CustomerInput { name: string; company?: string; phone: string; email?: string; sites: string[]; memo?: string }

const PHONE_RE = inquiryFormSchema.shape.phone;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 고객 등록·수정. existing이 있으면 그 버전으로 수정한다. 중복 연락처는 막지 않는다(화면에서 경고). */
export async function saveCustomer(repo: Repository, input: CustomerInput, existing: Customer | null): Promise<Customer> {
  const name = input.name.trim(), phone = input.phone.trim();
  if (!name) throw new Error("고객명을 입력해주세요.");
  if (!phone) throw new Error("연락처를 입력해주세요.");
  if (!PHONE_RE.safeParse(phone).success) throw new Error("연락처 형식을 확인해주세요. 예) 010-1234-5678");
  const email = input.email?.trim(), company = input.company?.trim(), memo = input.memo?.trim();
  if (email && !EMAIL_RE.test(email)) throw new Error("이메일 형식을 확인해주세요.");
  const sites = [...new Set(input.sites.map(s => s.trim()).filter(Boolean))];
  const body = { name, phone, sites, company: company || undefined, email: email || undefined, memo: memo || undefined };
  if (existing) return repo.update("customers", existing.id, body, existing.version);
  const data: Omit<Customer, "id" | "createdAt" | "updatedAt" | "version"> = { name, phone, sites };
  if (company) data.company = company;
  if (email) data.email = email;
  if (memo) data.memo = memo;
  return repo.create("customers", data);
}

/** 상담 메모 추가: 진행 중 의뢰가 있으면 그 의뢰 활동(메모)으로, 없으면 고객 메모에 `[날짜 이름] 내용` 줄로 붙인다. */
export async function addConsultNote(repo: Repository, customerId: string, message: string, actor: AdminId): Promise<{ target: "project" | "customer" }> {
  const text = message.trim();
  if (!text) throw new Error("메모 내용을 입력해주세요.");
  const c = await repo.get("customers", customerId);
  if (!c) throw new NotFoundError("고객");
  const active = (await repo.list("projects")).filter(p => p.customerId === customerId && p.status === "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (active) { await addProjectNote(repo, active.id, `상담 메모: ${text}`, actor); return { target: "project" }; }
  const line = formatMemoLine(koreaDate(), ADMINS[actor].name, text);
  await repo.update("customers", customerId, { memo: c.memo ? `${c.memo}\n${line}` : line }, c.version);
  return { target: "customer" };
}
