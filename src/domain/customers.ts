import type { Activity, AdminId, Customer, ISODate, ISOTime, Inquiry, Project } from "./types";
import { normalizePhone } from "./inquiries";

export const KST = "+09:00";

/** 고객에게 연결된 문의: customerId가 같거나 연락처가 같은 문의 */
export function inquiriesOfCustomer(c: Customer, inquiries: Inquiry[]): Inquiry[] {
  const n = normalizePhone(c.phone);
  return inquiries.filter(q => q.customerId === c.id || (!q.customerId && n !== "" && normalizePhone(q.phone) === n));
}

export interface ContactSources { inquiries: Inquiry[]; projects: Project[]; activities: Activity[] }

/** 최근 연락일 = 문의 접수·답변·고객 의뢰의 활동 중 가장 늦은 시각. 없으면 null. */
export function lastContactAt(c: Customer, src: ContactSources): ISOTime | null {
  const projectIds = new Set(src.projects.filter(p => p.customerId === c.id).map(p => p.id));
  const times: ISOTime[] = [];
  for (const q of inquiriesOfCustomer(c, src.inquiries)) { times.push(q.createdAt); for (const r of q.replies) times.push(r.at); }
  for (const a of src.activities) if (projectIds.has(a.projectId)) times.push(a.createdAt);
  return times.length ? times.reduce((m, t) => (t > m ? t : m)) : null;
}

/** 고객 메모의 상담 메모 줄: `[YYYY-MM-DD 이름] 내용` */
export const MEMO_LINE = /^\[(\d{4}-\d{2}-\d{2}) ([^\]]+)\] (.*)$/;
export function formatMemoLine(date: ISODate, name: string, message: string): string {
  return `[${date} ${name}] ${message.trim().replace(/\s*\n\s*/g, " ")}`;
}
/** 메모를 상담 메모 줄과 그 외 줄로 나눈다 */
export function splitMemo(memo: string | undefined): { notes: { date: ISODate; who: string; text: string; line: number }[]; rest: string } {
  const notes: { date: ISODate; who: string; text: string; line: number }[] = [];
  const rest: string[] = [];
  (memo ?? "").split("\n").forEach((ln, i) => {
    const m = MEMO_LINE.exec(ln);
    if (m) notes.push({ date: m[1], who: m[2], text: m[3], line: i }); else rest.push(ln);
  });
  return { notes, rest: rest.join("\n").trim() };
}

export type TimelineKind = "inquiry" | "reply" | "activity" | "memo";
export interface TimelineEntry { id: string; at: ISOTime; kind: TimelineKind; title: string; body: string; projectId?: string; by?: AdminId | "web" | string }

/** 문의·답변·의뢰 활동·상담 메모를 시간 내림차순으로 합친 타임라인 */
export function customerTimeline(c: Customer, src: ContactSources, labels: { source: (q: Inquiry) => string; channel: (r: Inquiry["replies"][number]) => string }): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const q of inquiriesOfCustomer(c, src.inquiries)) {
    out.push({ id: `q-${q.id}`, at: q.createdAt, kind: "inquiry", title: `문의 접수(${labels.source(q)})`, body: q.message });
    for (const r of q.replies) out.push({ id: `r-${r.id}`, at: r.at, kind: "reply", title: `답변(${labels.channel(r)})`, body: r.message, by: r.by });
  }
  const mine = new Map(src.projects.filter(p => p.customerId === c.id).map(p => [p.id, p]));
  for (const a of src.activities) {
    const p = mine.get(a.projectId);
    if (p) out.push({ id: `a-${a.id}`, at: a.createdAt, kind: "activity", title: p.title, body: a.message, projectId: p.id, by: a.actorId });
  }
  for (const n of splitMemo(c.memo).notes) out.push({ id: `m-${n.line}`, at: `${n.date}T12:00:00${KST}`, kind: "memo", title: "상담 메모", body: n.text, by: n.who });
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export type CustomerSort = "recent" | "name" | "receivable";
