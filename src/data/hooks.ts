"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRepo } from "./DataProvider";
import type { CollectionMap, CollectionName } from "./repository";
import type { Admin, ISODate, Settings } from "@/domain/types";
import { ADMINS } from "@/domain/defaults";
import { koreaDate } from "@/domain/dates";
import { ADMIN_CHANGE_EVENT, getCurrentAdminId } from "./auth";
import { ConflictError } from "./errors";

export { useRepo } from "./DataProvider";

/** 컬렉션 목록(변경 시 자동 갱신) */
export function useCollection<K extends CollectionName>(name: K): { items: CollectionMap[K][]; loading: boolean } {
  const repo = useRepo();
  const [state, setState] = useState<{ name: K; items: CollectionMap[K][]; loading: boolean }>({ name, items: [], loading: true });
  useEffect(() => {
    let alive = true;
    const load = () => { repo.list(name).then(items => { if (alive) setState({ name, items, loading: false }); }, () => { if (alive) setState({ name, items: [], loading: false }); }); };
    load();
    const off = repo.subscribe(load);
    return () => { alive = false; off(); };
  }, [repo, name]);
  // name이 바뀐 직후에는 이전 컬렉션 대신 로딩 상태를 보여준다.
  return state.name === name ? { items: state.items, loading: state.loading } : { items: [], loading: true };
}

/** 설정(변경 시 자동 갱신). 불러오기 전에는 null. */
export function useSettings(): Settings | null {
  const repo = useRepo();
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => { repo.getSettings().then(v => { if (alive) setS(v); }); };
    load();
    const off = repo.subscribe(load);
    return () => { alive = false; off(); };
  }, [repo]);
  return s;
}

/** 오늘 날짜(한국 시간). 1분마다 확인해 자정이 지나면 바뀐다. */
export function useToday(): ISODate {
  const [today, setToday] = useState<ISODate>(() => koreaDate());
  useEffect(() => {
    const t = setInterval(() => setToday(koreaDate()), 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}

/** 현재 로그인한 관리자(브라우저에서 확인되면 ready = true) */
export function useAdmin(): { admin: Admin | null; ready: boolean } {
  const [state, setState] = useState<{ admin: Admin | null; ready: boolean }>({ admin: null, ready: false });
  useEffect(() => {
    const read = () => { const id = getCurrentAdminId(); setState({ admin: id ? ADMINS[id] : null, ready: true }); };
    const t = setTimeout(read, 0);
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === "gn-demo-admin") read(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(ADMIN_CHANGE_EVENT, read);
    return () => { clearTimeout(t); window.removeEventListener("storage", onStorage); window.removeEventListener(ADMIN_CHANGE_EVENT, read); };
  }, []);
  return state;
}

/** 쓰기 동작 실행: 성공 시 안내(선택), 실패 시 오류 안내(버전 충돌 포함). 저장 중에는 busy = true. */
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const run = useCallback(async <T,>(fn: () => Promise<T>, okMessage?: string, opts?: { exclusive?: boolean }): Promise<T | undefined> => {
    const exclusive = opts?.exclusive === true;
    if (exclusive) { if (inFlight.current) return undefined; inFlight.current = true; }
    setBusy(true);
    try {
      const r = await fn();
      if (okMessage) toast.success(okMessage);
      return r;
    } catch (e) {
      toast.error(e instanceof ConflictError ? e.message : e instanceof Error ? e.message : "저장하지 못했습니다.");
      return undefined;
    } finally {
      if (exclusive) inFlight.current = false;
      setBusy(false);
    }
  }, []);
  return { run, busy };
}
