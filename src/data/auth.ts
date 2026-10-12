import type { AdminId } from "@/domain/types";
import { browserStore, type KeyValueStore } from "./storage";
const KEY = "gn-demo-admin";
// window는 호출 시점에만 접근한다(정적 내보내기 빌드 중 import 안전). browserStore()는 처음 결정한 저장소를 기억하므로
// localStorage를 못 쓰는 환경에서도 같은 메모리 저장소에 로그인이 유지된다.
const st = (s?: KeyValueStore) => s ?? (typeof window === "undefined" ? null : browserStore());
export function getCurrentAdminId(store?: KeyValueStore): AdminId | null {
  const v = st(store)?.getItem(KEY); return v === "kim" || v === "choi" ? v : null;
}
/** 같은 탭 안에서 로그인 상태가 바뀌었음을 알리는 이벤트 이름(storage 이벤트는 다른 탭에서만 온다). */
export const ADMIN_CHANGE_EVENT = "gn-admin-change";
const notify = (store?: KeyValueStore) => { if (!store && typeof window !== "undefined") window.dispatchEvent(new Event(ADMIN_CHANGE_EVENT)); };
export function signIn(id: AdminId, store?: KeyValueStore) { const s = st(store); s?.setItem(KEY, id); s?.setItem("gn-exclude-stats", "1"); notify(store); }
export function signOut(store?: KeyValueStore) { st(store)?.removeItem(KEY); notify(store); }
