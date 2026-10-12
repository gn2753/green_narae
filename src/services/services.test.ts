import { describe, it, expect, beforeEach } from "vitest";
import { createMockRepository } from "@/data/mockRepository";
import { memoryStore } from "@/data/storage";
import { buildSeed } from "@/data/seed";
import type { Repository } from "@/data/repository";
import { submitWebInquiry, replyToInquiry, startProjectFromInquiry, createManualInquiry, closeInquiry, reopenInquiry } from "./inquiryService";
import { moveStage, setWaiting, updateProjectFields, createProjectWithCustomer, updateStageRecord } from "./projectService";
import { saveContract, confirmPayment, setOrderStatus, addExtraPayment, saveVendor, saveOrder, saveLedgerEntry } from "./moneyService";
import { saveTask } from "./taskService";
import { registerPortfolioFromProject, reorderPortfolios, savePortfolio, deletePortfolio, saveNews, deleteNews } from "./contentService";

let repo: Repository;
beforeEach(() => { repo = createMockRepository({ store: memoryStore(), seed: () => buildSeed("2026-10-11"), now: () => new Date("2026-10-11T01:00:00Z") }); });

describe("services", () => {
  it("홈페이지 문의 → A09 미답변 NEW", async () => {
    const q = await submitWebInquiry(repo, { name: "홍길동", phone: "010-5555-6666", email: "h@x.kr", message: "카페 채널간판 견적 부탁드려요", agree: true });
    expect(q).toMatchObject({ source: "web", status: "open", isNew: true });
  });
  it("답변 → 고객 등록+의뢰 시작 → 상담·실측 단계, 활동 기록", async () => {
    const q = await submitWebInquiry(repo, { name: "홍길동", phone: "010-5555-6666", email: "h@x.kr", message: "카페 채널간판 견적 부탁드려요", agree: true });
    await replyToInquiry(repo, q.id, { channel: "phone", message: "실측 일정 잡음" }, "kim");
    const { customer, project } = await startProjectFromInquiry(repo, q.id, { newCustomer: { name: "홍길동", phone: "010-5555-6666", company: "길동카페" }, title: "길동카페 채널간판", signType: "채널간판" }, "kim");
    expect(project.stage).toBe("measure"); expect(project.assigneeId).toBe("choi"); expect(project.customerId).toBe(customer.id);
    const inq = await repo.get("inquiries", q.id);
    expect(inq).toMatchObject({ status: "answered", customerId: customer.id, projectId: project.id });
    expect((await repo.list("activities")).some(a => a.projectId === project.id && a.type === "create")).toBe(true);
  });
  it("단계 이동은 활동 기록을 남긴다", async () => {
    const p = (await repo.list("projects")).find(x => x.stage === "measure")!;
    const moved = await moveStage(repo, p.id, "design", p.version, "kim");
    expect(moved.stage).toBe("design");
    expect((await repo.list("activities")).find(a => a.projectId === p.id && a.type === "stage")?.message).toContain("건너뜀");
  });
  it("계약완료 저장 → 입금 예정 2건 생성, 입금 확인 → 매출 초안", async () => {
    const customerId = (await repo.list("customers"))[0].id;
    const k = await saveContract(repo, { customerId, projectId: null, status: "signed", quoteAmount: 1_000_000, vatIncluded: true, contractAmount: 1_100_000, deposit: { amount: 500_000, dueDate: "2026-10-12" }, balance: { amount: 600_000, dueDate: "2026-10-20" } }, null, "kim");
    const ps = (await repo.list("payments")).filter(p => p.contractId === k.id);
    expect(ps).toHaveLength(2);
    const { payment, ledgerDraft } = await confirmPayment(repo, ps[0].id, { paidOn: "2026-10-11" }, "kim");
    expect(payment.paidOn).toBe("2026-10-11"); expect(ledgerDraft.type).toBe("sale");
  });
  it("디자인 업무 완료 저장 → 시공 및 납품으로 인계", async () => {
    const t = (await repo.list("tasks")).find(x => x.category === "design" && x.status !== "done")!;
    const saved = await saveTask(repo, { ...t, status: "done" }, t, "kim");
    expect(saved.category).toBe("owner");
  });
  it("시공 의뢰 → 시공사례 비공개 초안", async () => {
    const p = (await repo.list("projects")).find(x => x.stage === "install")!;
    const pf = await registerPortfolioFromProject(repo, p.id, "kim");
    expect(pf.published).toBe(false);
    expect((await repo.get("projects", p.id))?.portfolioId).toBe(pf.id);
  });

  it("문의 연락처가 기존 고객과 같으면 새 고객을 만들지 않는다", async () => {
    const before = await repo.list("customers");
    const q = await createManualInquiry(repo, { name: "박○○", phone: before[0].phone.replace(/-/g, ""), message: "전화로 간판 보수 문의", source: "phone" }, "kim");
    expect(q).toMatchObject({ source: "phone", status: "open", isNew: false });
    const { customer } = await startProjectFromInquiry(repo, q.id, { title: "보수", signType: "채널간판" }, "kim");
    expect(customer.id).toBe(before.find(c => c.phone === before[0].phone)!.id);
    expect(await repo.list("customers")).toHaveLength(before.length);
  });
  it("종료된 문의는 의뢰를 시작해도 종료 상태를 유지한다", async () => {
    const q = await submitWebInquiry(repo, { name: "홍길동", phone: "010-5555-7777", email: "h@x.kr", message: "간판 철거만 가능한가요? 문의드립니다", agree: true });
    await closeInquiry(repo, q.id);
    await startProjectFromInquiry(repo, q.id, { title: "철거", signType: "기타" }, "kim");
    expect((await repo.get("inquiries", q.id))?.status).toBe("closed");
  });
  it("종료한 문의를 다시 열면 open 상태가 된다", async () => {
    const q = await submitWebInquiry(repo, { name: "홍길동", phone: "010-5555-8888", email: "h@x.kr", message: "간판 철거만 가능한가요? 문의드립니다", agree: true });
    await closeInquiry(repo, q.id);
    expect((await repo.get("inquiries", q.id))?.status).toBe("closed");
    await reopenInquiry(repo, q.id);
    expect((await repo.get("inquiries", q.id))?.status).toBe("open");
  });
  it("대기 표시는 버전을 확인하고 활동을 남긴다", async () => {
    const p = (await repo.list("projects")).find(x => !x.waiting)!;
    const saved = await setWaiting(repo, p.id, { reason: "입금" }, p.version, "kim");
    expect(saved.waiting?.reason).toBe("입금");
    await expect(setWaiting(repo, p.id, null, p.version, "kim")).rejects.toThrow();
  });
  it("발주 수령완료 → 수령일 기록 + 매입 초안", async () => {
    const o = (await repo.list("orders")).find(x => x.status === "shipped")!;
    const { order, ledgerDraft } = await setOrderStatus(repo, o.id, "received", "choi");
    expect(order.receivedOn).not.toBeNull();
    expect(ledgerDraft?.type).toBe("purchase");
    const r2 = await setOrderStatus(repo, o.id, "producing", "choi");
    expect(r2.ledgerDraft).toBeNull(); expect(r2.order.receivedOn).toBeNull();
  });
  it("다시 계약완료로 저장해도 입금 예정을 중복 생성하지 않는다", async () => {
    const customerId = (await repo.list("customers"))[0].id;
    const input = { customerId, projectId: null, status: "signed" as const, quoteAmount: 1_000_000, vatIncluded: true, contractAmount: 1_100_000, deposit: { amount: 500_000, dueDate: "2026-10-12" }, balance: { amount: 600_000, dueDate: "2026-10-20" } };
    let k = await saveContract(repo, input, null, "kim");
    k = await saveContract(repo, { ...input, status: "sent" }, k, "kim");
    await saveContract(repo, input, k, "kim");
    expect((await repo.list("payments")).filter(p => p.contractId === k.id)).toHaveLength(2);
  });
  it("추가 입금 항목은 계약의 고객·의뢰를 이어받고 금액 검증을 한다", async () => {
    const c = (await repo.list("contracts")).find(x => x.projectId)!;
    const p = await addExtraPayment(repo, { contractId: c.id, amount: 300_000, dueDate: "2026-10-25" }, "kim");
    expect(p).toMatchObject({ kind: "extra", customerId: c.customerId, projectId: c.projectId, amount: 300_000, dueDate: "2026-10-25", paidOn: null });
    await expect(addExtraPayment(repo, { contractId: c.id, amount: 0, dueDate: "2026-10-25" }, "kim")).rejects.toThrow();
    await expect(addExtraPayment(repo, { contractId: "nope", amount: 1000, dueDate: "2026-10-25" }, "kim")).rejects.toThrow();
  });
  it("이미 입금 확인된 항목은 다시 확인할 수 없다", async () => {
    const p = (await repo.list("payments")).find(x => !x.paidOn)!;
    await confirmPayment(repo, p.id, { paidOn: "2026-10-11" }, "kim");
    await expect(confirmPayment(repo, p.id, { paidOn: "2026-10-11" }, "kim")).rejects.toThrow("이미 입금 확인된 항목입니다.");
  });
  it("이미 의뢰가 시작된 문의는 다시 시작할 수 없다", async () => {
    const q = (await repo.list("inquiries")).find(x => x.projectId)!;
    await expect(startProjectFromInquiry(repo, q.id, { title: "중복", signType: "채널간판" }, "kim")).rejects.toThrow("이미 의뢰가 시작된 문의입니다.");
  });
  it("시공사례가 이미 있으면 기존 초안을 돌려준다", async () => {
    const p = (await repo.list("projects")).find(x => x.stage === "install")!;
    const first = await registerPortfolioFromProject(repo, p.id, "kim");
    const count = (await repo.list("portfolios")).length;
    const second = await registerPortfolioFromProject(repo, p.id, "kim");
    expect(second.id).toBe(first.id);
    expect(await repo.list("portfolios")).toHaveLength(count);
  });
  it("포트폴리오 순서 변경", async () => {
    const ids = (await repo.list("portfolios")).map(p => p.id).reverse();
    await reorderPortfolios(repo, ids);
    const after = await repo.list("portfolios");
    expect(after.find(p => p.id === ids[0])?.order).toBe(1);
  });
  it("시공사례 저장 검증·순서·삭제 시 의뢰 연결 해제", async () => {
    const att = { id: "a", name: "a.jpg", mime: "image/jpeg", url: "data:image/jpeg;base64,AA", size: 1, uploadedBy: "kim" as const, at: "2026-10-11T00:00:00Z" };
    const base = { title: "테스트 간판", signType: "채널간판", region: "세종", completedOn: "2026-10-01" as const, clientDisplayName: "", description: "", cover: att, images: [], published: false };
    await expect(savePortfolio(repo, { ...base, cover: null }, null)).rejects.toThrow("대표 이미지");
    await expect(savePortfolio(repo, { ...base, title: " " }, null)).rejects.toThrow("제목");
    await expect(savePortfolio(repo, { ...base, completedOn: "" }, null)).rejects.toThrow("시공일");
    const max = Math.max(...(await repo.list("portfolios")).map(x => x.order));
    const pf = await savePortfolio(repo, base, null);
    expect(pf.order).toBe(max + 1);
    const edited = await savePortfolio(repo, { ...base, title: "수정됨", published: true }, pf);
    expect(edited).toMatchObject({ title: "수정됨", published: true, order: pf.order, version: pf.version + 1 });
    const proj = (await repo.list("projects"))[0];
    await repo.update("projects", proj.id, { portfolioId: pf.id });
    await deletePortfolio(repo, pf.id);
    expect(await repo.get("portfolios", pf.id)).toBeNull();
    expect((await repo.get("projects", proj.id))?.portfolioId).toBeUndefined();
  });
  it("소식 저장 검증·삭제", async () => {
    const base = { category: "news" as const, title: "새 소식", summary: "요약", body: "본문", cover: null, publishedOn: "2026-10-11" as const, pinned: false, published: true };
    await expect(saveNews(repo, { ...base, summary: "" }, null)).rejects.toThrow("요약");
    await expect(saveNews(repo, { ...base, body: "" }, null)).rejects.toThrow("본문");
    await expect(saveNews(repo, { ...base, publishedOn: "" }, null)).rejects.toThrow("게시일");
    const n = await saveNews(repo, base, null);
    const e = await saveNews(repo, { ...base, title: "바뀜", pinned: true }, n);
    expect(e).toMatchObject({ title: "바뀜", pinned: true });
    await deleteNews(repo, n.id);
    expect(await repo.get("news", n.id)).toBeNull();
  });
  it("의뢰 인라인 수정은 버전을 확인하고 edit 활동을 남긴다", async () => {
    const p = (await repo.list("projects")).find(x => x.assigneeId === "kim")!;
    const saved = await updateProjectFields(repo, p.id, { assigneeId: "choi", dueDate: "2026-12-01" }, p.version, "kim");
    expect(saved).toMatchObject({ assigneeId: "choi", dueDate: "2026-12-01", version: p.version + 1 });
    const acts = (await repo.list("activities")).filter(a => a.projectId === p.id && a.type === "edit");
    expect(acts.map(a => a.message)).toContain(`담당자 변경: 김자연 → 최관웅 · 마감일 변경: ${p.dueDate ?? "없음"} → 2026-12-01`);
    await expect(updateProjectFields(repo, p.id, { title: "x" }, p.version, "kim")).rejects.toThrow();
    const n = (await repo.list("activities")).length;
    const same = await updateProjectFields(repo, p.id, { assigneeId: "choi" }, saved.version, "kim");
    expect(same.version).toBe(saved.version);
    expect(await repo.list("activities")).toHaveLength(n);
    await expect(updateProjectFields(repo, p.id, { title: "  " }, saved.version, "kim")).rejects.toThrow("건명을 입력해주세요.");
    await expect(updateProjectFields(repo, p.id, { dueDate: "0002-10-21" }, saved.version, "kim")).rejects.toThrow("마감일은");
  });
  it("새 의뢰: 새 고객 등록, 같은 연락처면 기존 고객에 연결", async () => {
    const before = await repo.list("customers");
    const r1 = await createProjectWithCustomer(repo, { newCustomer: { name: "새손님", phone: "010-7777-1234", company: "새가게" }, title: "새가게 채널간판", signType: "채널간판", stage: "quote" }, "kim");
    expect(r1.reusedCustomer).toBe(false);
    expect(r1.project).toMatchObject({ customerId: r1.customer.id, stage: "quote", assigneeId: "kim" });
    expect(await repo.list("customers")).toHaveLength(before.length + 1);
    const r2 = await createProjectWithCustomer(repo, { newCustomer: { name: "다른이름", phone: before[0].phone }, title: "추가 건", signType: "돌출간판" }, "kim");
    expect(r2.reusedCustomer).toBe(true); expect(r2.customer.id).toBe(before[0].id);
    await expect(createProjectWithCustomer(repo, { newCustomer: { name: "", phone: "" }, title: "x", signType: "채널간판" }, "kim")).rejects.toThrow("고객 이름과 연락처를 입력해주세요.");
  });
  it("단계 기록 저장 시 활동 문구를 지정할 수 있다", async () => {
    const p = (await repo.list("projects")).find(x => x.stage === "design")!;
    await updateStageRecord(repo, p.id, "design", { fields: {}, attachments: [], designVersions: [] }, p.version, "kim", "시안 3차 추가", "attach");
    expect((await repo.list("activities")).find(a => a.projectId === p.id && a.message === "시안 3차 추가")?.type).toBe("attach");
  });
});

import { saveCustomer, addConsultNote } from "./customerService";
describe("customerService", () => {
  it("고객 저장: 필수·형식 검사, 공백 정리, 현장 주소 정리", async () => {
    await expect(saveCustomer(repo, { name: " ", phone: "010-1234-5678", sites: [] }, null)).rejects.toThrow("고객명");
    await expect(saveCustomer(repo, { name: "홍", phone: "", sites: [] }, null)).rejects.toThrow("연락처");
    await expect(saveCustomer(repo, { name: "홍", phone: "123", sites: [] }, null)).rejects.toThrow("형식");
    const c = await saveCustomer(repo, { name: " 홍길동 ", phone: " 010-1234-5678 ", company: " ", sites: [" 서울 A ", "", "서울 A", "부산 B"] }, null);
    expect(c).toMatchObject({ name: "홍길동", phone: "010-1234-5678", sites: ["서울 A", "부산 B"] });
    expect(c.company).toBeUndefined();
    const u = await saveCustomer(repo, { name: "홍길순", phone: "010-1234-5678", company: "길순상회", sites: [] }, c);
    expect(u).toMatchObject({ id: c.id, name: "홍길순", company: "길순상회", version: c.version + 1 });
  });
  it("상담 메모: 진행 중 의뢰가 있으면 활동, 없으면 고객 메모에 날짜·이름 줄", async () => {
    const active = (await repo.list("projects")).find(p => p.status === "active")!;
    const before = (await repo.list("activities")).length;
    expect(await addConsultNote(repo, active.customerId, "  색상 변경 요청 ", "kim")).toEqual({ target: "project" });
    const acts = await repo.list("activities");
    expect(acts).toHaveLength(before + 1);
    expect(acts.find(a => a.message.includes("색상 변경 요청"))).toMatchObject({ projectId: active.id, type: "note" });
    const c = await saveCustomer(repo, { name: "신규", phone: "010-7777-8888", sites: [] }, null);
    expect(await addConsultNote(repo, c.id, "첫 상담", "choi")).toEqual({ target: "customer" });
    expect((await repo.get("customers", c.id))?.memo).toMatch(/^\[\d{4}-\d{2}-\d{2} 최관웅\] 첫 상담$/);
    await addConsultNote(repo, c.id, "두번째", "kim");
    expect((await repo.get("customers", c.id))?.memo?.split("\n")).toHaveLength(2);
    await expect(addConsultNote(repo, c.id, "  ", "kim")).rejects.toThrow();
  });
});

describe("vendor·order·ledger 저장", () => {
  it("업체: 이름 필수·분야는 설정 값, 수정은 version 증가", async () => {
    await expect(saveVendor(repo, { name: " ", field: "채널" }, null)).rejects.toThrow("업체명");
    await expect(saveVendor(repo, { name: "A", field: "없는분야" }, null)).rejects.toThrow("분야");
    const field = (await repo.getSettings()).vendorFields[0];
    const v = await saveVendor(repo, { name: " 새업체 ", field, phone: " " }, null);
    expect(v.name).toBe("새업체"); expect(v.phone).toBeUndefined();
    expect((await saveVendor(repo, { name: "새업체2", field }, v)).version).toBe(v.version + 1);
  });
  it("발주: 검증 후 저장, 의뢰 연결 시 활동 기록", async () => {
    const vendor = (await repo.list("vendors"))[0]; const project = (await repo.list("projects"))[0];
    const base = { projectId: project.id, vendorId: vendor.id, item: "채널 문자", amount: 500_000, orderedOn: "2026-10-11", dueDate: "2026-10-20", status: "requested" as const, receivedOn: null };
    await expect(saveOrder(repo, { ...base, vendorId: "x" }, null, "kim")).rejects.toThrow("업체");
    await expect(saveOrder(repo, { ...base, item: " " }, null, "kim")).rejects.toThrow("품목");
    await expect(saveOrder(repo, { ...base, amount: 0 }, null, "kim")).rejects.toThrow("금액");
    await expect(saveOrder(repo, { ...base, dueDate: "2026-10-01" }, null, "kim")).rejects.toThrow("납기");
    const before = (await repo.list("activities")).length;
    const o = await saveOrder(repo, base, null, "kim");
    const acts = await repo.list("activities");
    expect(acts).toHaveLength(before + 1);
    expect(acts.find(a => a.message.startsWith("발주 등록"))?.message).toContain("채널 문자");
    await saveOrder(repo, { ...base, amount: 600_000 }, o, "kim");
    expect(await repo.list("activities")).toHaveLength(before + 1);
  });
  it("매입매출: 금액·날짜 검증, 매입은 비용 항목 필수", async () => {
    const base = { type: "purchase" as const, date: "2026-10-11", amount: 100_000, vat: 10_000, category: "자재비" };
    await expect(saveLedgerEntry(repo, { ...base, amount: 0 }, null)).rejects.toThrow("금액");
    await expect(saveLedgerEntry(repo, { ...base, date: "" }, null)).rejects.toThrow("날짜");
    await expect(saveLedgerEntry(repo, { ...base, category: undefined }, null)).rejects.toThrow("비용 항목");
    const e = await saveLedgerEntry(repo, base, null);
    expect(e).toMatchObject({ amount: 100_000, vat: 10_000 });
    const sale = await saveLedgerEntry(repo, { type: "sale", date: "2026-10-11", amount: 1000, vat: 100 }, null);
    expect(sale.category).toBeUndefined();
  });
});
