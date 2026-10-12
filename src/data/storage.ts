export interface KeyValueStore { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; }
export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k) };
}
let cachedBrowserStore: KeyValueStore | null = null;
/**
 * 브라우저 저장소. 처음 호출할 때 한 번만 결정해 기억한다:
 * localStorage를 못 쓰면(사생활 보호 모드 등) 같은 메모리 저장소를 계속 재사용해 세션 동안 로그인·데이터가 유지된다.
 * window는 호출 시점에만 접근한다(import 시 접근 금지). 서버(window 없음)에서는 기억하지 않고 임시 메모리 저장소를 준다.
 */
export function browserStore(): KeyValueStore {
  if (cachedBrowserStore) return cachedBrowserStore;
  if (typeof window === "undefined") return memoryStore();
  try { const t = "__gn_test"; window.localStorage.setItem(t, "1"); window.localStorage.removeItem(t); cachedBrowserStore = window.localStorage; }
  catch { cachedBrowserStore = memoryStore(); }
  return cachedBrowserStore;
}
