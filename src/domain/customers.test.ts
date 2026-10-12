import { describe, it, expect } from "vitest";
import type { Activity, Customer, Inquiry, Project } from "./types";
import { customerTimeline, formatMemoLine, inquiriesOfCustomer, lastContactAt, splitMemo } from "./customers";

const base = { updatedAt: "", version: 1 };
const c: Customer = { id: "c1", name: "박○○", phone: "010-1111-2222", sites: [], memo: "첫 줄\n[2026-10-05 김자연] 전화 상담", createdAt: "2026-09-01T00:00:00Z", ...base };
const q = (o: Partial<Inquiry>): Inquiry => ({ id: "q1", name: "박", phone: "010-1111-2222", message: "문의", source: "web", status: "open", isNew: false, assigneeId: null, customerId: null, projectId: null, replies: [], createdAt: "2026-10-01T01:00:00Z", ...base, ...o });
const p = { id: "p1", customerId: "c1", title: "간판" } as Project;
const act = (o: Partial<Activity>): Activity => ({ id: "a1", projectId: "p1", actorId: "kim", type: "note", message: "m", createdAt: "2026-10-03T01:00:00Z", ...base, ...o });
const labels = { source: () => "홈페이지", channel: () => "전화" };

describe("customers domain", () => {
  it("문의는 customerId 또는 연락처로 연결", () => {
    const qs = [q({ id: "a", phone: "01011112222" }), q({ id: "b", customerId: "c1", phone: "010-9" }), q({ id: "c", phone: "010-0000-0000" })];
    expect(inquiriesOfCustomer(c, qs).map(x => x.id)).toEqual(["a", "b"]);
  });
  it("최근 연락일: 문의·답변·활동 중 최신, 없으면 null", () => {
    const inq = q({ replies: [{ id: "r", at: "2026-10-09T05:00:00Z", by: "kim", channel: "phone", message: "x" }] });
    expect(lastContactAt(c, { inquiries: [inq], projects: [p], activities: [act({})] })).toBe("2026-10-09T05:00:00Z");
    expect(lastContactAt(c, { inquiries: [inq], projects: [p], activities: [act({ createdAt: "2026-10-10T00:00:00Z" })] })).toBe("2026-10-10T00:00:00Z");
    expect(lastContactAt(c, { inquiries: [], projects: [p], activities: [act({ projectId: "other" })] })).toBeNull();
  });
  it("메모 줄 분리·생성", () => {
    expect(formatMemoLine("2026-10-11", "김자연", " 내용\n두줄 ")).toBe("[2026-10-11 김자연] 내용 두줄");
    expect(splitMemo(c.memo)).toMatchObject({ rest: "첫 줄", notes: [{ date: "2026-10-05", who: "김자연", text: "전화 상담" }] });
  });
  it("타임라인은 최신순으로 문의·답변·활동·메모를 합친다", () => {
    const inq = q({ replies: [{ id: "r", at: "2026-10-02T01:00:00Z", by: "kim", channel: "phone", message: "답" }] });
    const t = customerTimeline(c, { inquiries: [inq], projects: [p], activities: [act({})] }, labels);
    expect(t.map(e => e.kind)).toEqual(["memo", "activity", "reply", "inquiry"]);
  });
});
