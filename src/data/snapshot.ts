import type { DemoSnapshot } from "./repository";

const COLLECTIONS = ["customers", "inquiries", "projects", "activities", "tasks", "contracts", "payments", "vendors", "orders", "ledger", "portfolios", "news", "visits"] as const;
const STRING_LISTS = ["waitingReasons", "signTypes", "purchaseCategories", "vendorFields", "excludedVisitorIds"] as const;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";

/**
 * 백업 파일을 검사하고, 빠진 컬렉션은 빈 목록으로 채운 사본을 돌려준다(예전 백업 허용).
 * 맞지 않으면 사용자에게 그대로 보여줄 문구로 Error를 던진다.
 */
export function parseSnapshot(s: unknown): DemoSnapshot {
  if (!isObj(s) || s.schema !== 1) throw new Error("그린나래 백업 파일이 아닙니다.");
  if (s.collections !== undefined && !isObj(s.collections)) throw new Error("백업 파일의 데이터 구성이 맞지 않습니다.");
  const src = (s.collections ?? {}) as Record<string, unknown>;
  const collections: Record<string, unknown[]> = {};
  for (const k of COLLECTIONS) {
    const list = src[k] ?? [];
    if (!Array.isArray(list)) throw new Error(`백업 파일의 ‘${k}’ 데이터 형식이 맞지 않습니다.`);
    for (const d of list) {
      if (!isObj(d) || !isStr(d.id) || !isStr(d.createdAt) || !isStr(d.updatedAt) || typeof d.version !== "number" || !Number.isFinite(d.version)) {
        throw new Error(`백업 파일의 ‘${k}’ 항목에 손상된 데이터가 있습니다.`);
      }
    }
    collections[k] = list;
  }
  const st = s.settings;
  if (!isObj(st) || !isObj(st.notifications)) throw new Error("백업 파일의 설정 구성이 맞지 않습니다.");
  for (const k of STRING_LISTS) if (!Array.isArray(st[k]) || !(st[k] as unknown[]).every(isStr)) throw new Error("백업 파일의 설정 구성이 맞지 않습니다.");
  for (const k of ["taskCategories", "stages"] as const) {
    const list = st[k];
    if (!Array.isArray(list) || !list.every(e => isObj(e) && isStr(e.key) && isStr(e.label))) throw new Error("백업 파일의 설정 구성이 맞지 않습니다.");
  }
  if (!(st.stages as Record<string, unknown>[]).every(e => isStr(e.color) && /^#[0-9a-f]{6}$/i.test(e.color))) throw new Error("백업 파일의 설정 구성이 맞지 않습니다.");
  return { ...(s as unknown as DemoSnapshot), collections: collections as unknown as DemoSnapshot["collections"] };
}

/** 검사만 필요할 때(기존 호출부 호환) */
export function assertSnapshot(s: unknown): asserts s is DemoSnapshot { parseSnapshot(s); }
