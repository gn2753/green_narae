import { describe, it, expect, vi } from "vitest";
import { createMockRepository, STORAGE_KEY } from "./mockRepository";
import { memoryStore } from "./storage";
import { ConflictError } from "./errors";
import type { DemoSnapshot } from "./repository";
import { parseSnapshot } from "./snapshot";
import { buildSeed } from "./seed";
import { DEFAULT_SETTINGS } from "@/domain/defaults";

const empty = (): DemoSnapshot => ({ schema: 1, settings: DEFAULT_SETTINGS, collections: { customers: [], inquiries: [], projects: [], activities: [], tasks: [], contracts: [], payments: [], vendors: [], orders: [], ledger: [], portfolios: [], news: [], visits: [] } });
let n = 0;
const make = (store = memoryStore()) => createMockRepository({ store, seed: empty, now: () => new Date("2026-10-11T01:00:00Z"), newId: () => `id${++n}` });

describe("mock repository", () => {
  it("처음 접근 시 seed를 저장한다", async () => {
    const store = memoryStore(); const repo = make(store);
    expect(await repo.list("customers")).toEqual([]);
    expect(store.getItem(STORAGE_KEY)).toContain('"schema":1');
  });
  it("create는 id·시각·version을 채운다", async () => {
    const repo = make();
    const c = await repo.create("customers", { name: "박", phone: "010", sites: [] });
    expect(c).toMatchObject({ name: "박", version: 1, createdAt: "2026-10-11T01:00:00.000Z" });
    expect(await repo.get("customers", c.id)).toEqual(c);
  });
  it("update는 version을 올리고, 버전이 다르면 ConflictError", async () => {
    const repo = make();
    const c = await repo.create("customers", { name: "박", phone: "010", sites: [] });
    const u = await repo.update("customers", c.id, { name: "박지성" }, 1);
    expect(u.version).toBe(2);
    await expect(repo.update("customers", c.id, { name: "x" }, 1)).rejects.toBeInstanceOf(ConflictError);
  });
  it("변경 시 구독자에게 알린다", async () => {
    const repo = make(); const cb = vi.fn(); const off = repo.subscribe(cb);
    await repo.create("customers", { name: "박", phone: "010", sites: [] });
    expect(cb).toHaveBeenCalledTimes(1); off();
    await repo.create("customers", { name: "김", phone: "011", sites: [] });
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it("같은 저장소를 쓰는 두 인스턴스는 데이터를 공유(다른 탭 흉내)", async () => {
    const store = memoryStore(); const a = make(store), b = make(store);
    await a.create("customers", { name: "박", phone: "010", sites: [] });
    expect(await b.list("customers")).toHaveLength(1);
  });
  it("reset은 seed로 되돌리고, export/import는 왕복된다", async () => {
    const repo = make();
    await repo.create("customers", { name: "박", phone: "010", sites: [] });
    const snap = await repo.exportAll();
    await repo.reset(); expect(await repo.list("customers")).toEqual([]);
    await repo.importAll(snap); expect(await repo.list("customers")).toHaveLength(1);
  });
  it("구조가 맞지 않는 백업은 거부하고 기존 데이터를 지키지 않는다(가져오기 전 검사)", async () => {
    const repo = createMockRepository({ store: memoryStore(), seed: () => empty(), now: () => new Date("2026-10-11T01:00:00Z"), newId: () => `id${++n}` });
    await repo.create("customers", { name: "박", phone: "010", sites: [] });
    await expect(repo.importAll({ schema: 1 } as never)).rejects.toThrow();
    await expect(repo.importAll({ schema: 2 } as never)).rejects.toThrow();
    expect(await repo.list("customers")).toHaveLength(1);
  });
  it("백업 검증: 손상 항목 거부, 빠진 컬렉션은 빈 목록으로 채움, 자체 내보내기는 통과", async () => {
    const repo = createMockRepository({ store: memoryStore(), seed: () => empty(), now: () => new Date("2026-10-11T01:00:00Z"), newId: () => `id${++n}` });
    await repo.create("customers", { name: "박", phone: "010", sites: [] });
    const snap = await repo.exportAll();
    expect(() => parseSnapshot(snap)).not.toThrow();
    expect(() => parseSnapshot(buildSeed("2026-10-11"))).not.toThrow();
    const clone = () => JSON.parse(JSON.stringify(snap));
    const nul = clone(); nul.collections.customers.push(null);
    expect(() => parseSnapshot(nul)).toThrow(/손상/);
    const noId = clone(); noId.collections.tasks.push({ createdAt: "x", updatedAt: "x", version: 1 });
    expect(() => parseSnapshot(noId)).toThrow();
    const badColor = clone(); badColor.settings.stages[0].color = "red";
    expect(() => parseSnapshot(badColor)).toThrow();
    const badTag = clone(); badTag.settings.signTypes.push(5);
    expect(() => parseSnapshot(badTag)).toThrow();
    const old = clone(); delete old.collections.visits;
    expect(parseSnapshot(old).collections.visits).toEqual([]);
    await repo.importAll(old);
    expect(await repo.list("visits")).toEqual([]);
    expect(await repo.list("customers")).toHaveLength(1);
  });
  it("seed 객체를 참조로 쓰지 않는다(공유 상수 보호)", async () => {
    const shared = empty();
    const repo = createMockRepository({ store: memoryStore(), seed: () => shared, now: () => new Date("2026-10-11T01:00:00Z"), newId: () => `id${++n}` });
    expect(await repo.getSettings()).not.toBe(DEFAULT_SETTINGS);
    await repo.create("customers", { name: "박", phone: "010", sites: [] });
    expect(shared.collections.customers).toEqual([]);
    expect(DEFAULT_SETTINGS.excludedVisitorIds).toEqual([]);
  });
  it("캐시: 다른 인스턴스가 쓴 내용을 이벤트 없이도 다시 읽는다", async () => {
    const store = memoryStore(); const a = make(store), b = make(store);
    expect(await a.list("customers")).toHaveLength(0); // a 캐시 생성
    await b.create("customers", { name: "박", phone: "010", sites: [] });
    expect(await a.list("customers")).toHaveLength(1);
  });
  it("캐시: 돌려준 목록·문서는 이후 쓰기로 바뀌지 않는다", async () => {
    const repo = make();
    const c = await repo.create("customers", { name: "박", phone: "010", sites: [] });
    const listed = await repo.list("customers"); const got = (await repo.get("customers", c.id))!;
    listed.push({ ...c, id: "fake" });
    await repo.update("customers", c.id, { name: "박지성" }, 1);
    await repo.create("customers", { name: "김", phone: "011", sites: [] });
    expect(got.name).toBe("박"); expect(got.version).toBe(1);
    expect(listed).toHaveLength(2);
    expect((await repo.list("customers")).map(x => x.id)).not.toContain("fake");
    const snap = await repo.exportAll(); snap.collections.customers.length = 0;
    expect(await repo.list("customers")).toHaveLength(2);
  });
  it("캐시: 저장 실패 시 캐시도 바뀌지 않는다", async () => {
    const inner = memoryStore(); let fail = false;
    const store = { getItem: inner.getItem, removeItem: inner.removeItem, setItem: (k: string, v: string) => { if (fail) throw new Error("quota"); inner.setItem(k, v); } };
    const repo = make(store);
    await repo.list("customers");
    fail = true;
    await expect(repo.create("customers", { name: "박", phone: "010", sites: [] })).rejects.toThrow("저장 공간");
    expect(await repo.list("customers")).toHaveLength(0);
  });
  it("settings 부분 수정", async () => {
    const repo = make();
    const s = await repo.updateSettings({ waitingReasons: ["입금"] });
    expect(s.waitingReasons).toEqual(["입금"]); expect(s.signTypes).toEqual(DEFAULT_SETTINGS.signTypes);
  });
});
