import { z } from "zod";
import type { Customer, Inquiry, Reply } from "./types";

export const inquiryFormSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(40),
  phone: z.string().trim().regex(/^0\d{1,2}-?\d{3,4}-?\d{4}$/, "연락처 형식을 확인해주세요. 예) 010-1234-5678"),
  email: z.string().trim().email("이메일 형식을 확인해주세요."),
  message: z.string().trim().min(10, "문의 내용을 10자 이상 적어주세요.").max(2000),
  agree: z.literal(true, { error: "개인정보 수집·이용에 동의해주세요." }),
});

export const normalizePhone = (s: string) => s.replace(/\D/g, "");
export function findCustomerByPhone(customers: Customer[], phone: string): Customer | null {
  const n = normalizePhone(phone);
  return customers.find(c => normalizePhone(c.phone) === n) ?? null;
}
export function addReply(inq: Inquiry, reply: Omit<Reply, "id">, id: string): Inquiry {
  return { ...inq, replies: [...inq.replies, { ...reply, id }], status: inq.status === "closed" ? "closed" : "answered", isNew: false, updatedAt: reply.at };
}
