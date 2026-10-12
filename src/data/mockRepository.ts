import { parseSnapshot } from "./snapshot";
import type { Base, Settings } from "@/domain/types";
import type { CollectionMap, CollectionName, DemoSnapshot, NewDoc, Repository } from "./repository";
import type { KeyValueStore } from "./storage";
import { ConflictError, NotFoundError } from "./errors";

export const STORAGE_KEY = "gn-demo-v1";

/**
 * localStorage 목업 저장소.
 * - 파싱한 스냅숏을 캐시하고, 저장소의 원본 문자열이 바뀌었을 때만 다시 파싱한다(다른 탭·다른 인스턴스가 쓴 경우 포함).
 * - 캐시는 변경 불가로 다룬다: 쓰기는 항상 새 스냅숏/새 배열/새 문서를 만들어 저장한 뒤에만 캐시를 바꾼다.
 *   그래서 이전에 돌려준 목록·문서는 이후 쓰기로 바뀌지 않고, 저장 실패 시 캐시도 그대로다.
 * - 목록은 얕은 복사본을 돌려준다. 문서·설정 객체는 공유되므로 호출 측에서 직접 고치지 않는다(읽기 전용).
 */
export function createMockRepository(opts: { store: KeyValueStore; seed: () => DemoSnapshot; now?: () => Date; newId?: () => string; listenStorageEvents?: boolean }): Repository {
  const now = () => (opts.now ?? (() => new Date()))().toISOString();
  const newId = opts.newId ?? (() => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());

  let cached: DemoSnapshot | null = null;
  let cachedRaw: string | null = null;
  const invalidate = () => { cached = null; cachedRaw = null; };

  const read = (): DemoSnapshot => {
    const raw = opts.store.getItem(STORAGE_KEY);
    if (cached && raw !== null && raw === cachedRaw) return cached;
    if (raw) {
      try { const s = JSON.parse(raw) as DemoSnapshot; if (s.schema === 1) { cached = s; cachedRaw = raw; return s; } } catch { /* fallthrough to seed */ }
    }
    // seed 객체를 그대로 쓰지 않고 저장한 JSON을 다시 파싱한 복사본을 쓴다(DEFAULT_SETTINGS 같은 공유 상수 변형 방지).
    const json = JSON.stringify(opts.seed()); opts.store.setItem(STORAGE_KEY, json);
    cached = JSON.parse(json) as DemoSnapshot; cachedRaw = json; return cached;
  };
  const write = (s: DemoSnapshot) => {
    const json = JSON.stringify(s);
    try { opts.store.setItem(STORAGE_KEY, json); }
    catch { throw new Error("브라우저 저장 공간이 부족합니다. 큰 이미지를 줄이거나 데모 데이터를 초기화해주세요."); }
    cached = s; cachedRaw = json;
    notify();
  };

  // 컬렉션 접근 헬퍼: 제네릭 K의 인덱스 접근을 CollectionMap[K][]로 좁힌다.
  const col = <K extends CollectionName>(s: DemoSnapshot, c: K) => s.collections[c] as CollectionMap[K][];
  const withCol = <K extends CollectionName>(s: DemoSnapshot, c: K, list: CollectionMap[K][]): DemoSnapshot =>
    ({ ...s, collections: { ...s.collections, [c]: list } });

  if (opts.listenStorageEvents && typeof window !== "undefined") {
    window.addEventListener("storage", e => { if (e.key === STORAGE_KEY || e.key === null) { invalidate(); notify(); } });
  }

  return {
    async list<K extends CollectionName>(c: K) { return [...col(read(), c)]; },
    async get<K extends CollectionName>(c: K, id: string) { return col(read(), c).find(d => d.id === id) ?? null; },
    async create<K extends CollectionName>(c: K, data: NewDoc<CollectionMap[K]>) {
      const s = read(); const t = now();
      const doc = { ...data, id: data.id ?? newId(), createdAt: t, updatedAt: t, version: 1 } as unknown as CollectionMap[K];
      write(withCol(s, c, [doc, ...col(s, c)])); return doc;
    },
    async update<K extends CollectionName>(c: K, id: string, patch: Partial<Omit<CollectionMap[K], keyof Base>>, expectedVersion?: number) {
      const s = read(); const list = col(s, c);
      const i = list.findIndex(d => d.id === id); if (i < 0) throw new NotFoundError(String(c));
      if (expectedVersion !== undefined && list[i].version !== expectedVersion) { notify(); throw new ConflictError(); }
      const doc = { ...list[i], ...patch, id, version: list[i].version + 1, updatedAt: now() } as CollectionMap[K];
      const next = [...list]; next[i] = doc;
      write(withCol(s, c, next)); return doc;
    },
    async remove<K extends CollectionName>(c: K, id: string) { const s = read(); write(withCol(s, c, col(s, c).filter(d => d.id !== id))); },
    async getSettings() { return read().settings; },
    async updateSettings(patch: Partial<Settings>) { const s = read(); const settings = { ...s.settings, ...patch }; write({ ...s, settings }); return settings; },
    subscribe(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
    async exportAll() { read(); return JSON.parse(cachedRaw!) as DemoSnapshot; },
    async importAll(snap) {
      const checked = parseSnapshot(snap);
      write(JSON.parse(JSON.stringify(checked)) as DemoSnapshot); // 호출 측 객체와 분리
    },
    async reset() { opts.store.removeItem(STORAGE_KEY); invalidate(); read(); notify(); },
  } satisfies Repository;
}
