"use client";
import { createContext, useContext, useState } from "react";
import type { Repository } from "./repository";
import { createMockRepository } from "./mockRepository";
import { browserStore, memoryStore } from "./storage";
import { buildSeed } from "./seed";
import { koreaDate } from "@/domain/dates";

const RepoContext = createContext<Repository | null>(null);

/** 앱 전체에 하나의 저장소(1차: localStorage 목업)를 제공한다. */
export function DataProvider({ children }: { children: React.ReactNode }) {
  // 저장소는 처음 한 번만 만든다. 서버 렌더링(정적 내보내기) 중에는 임시 메모리 저장소를 쓴다.
  const [repo] = useState<Repository>(() => createMockRepository({
    store: typeof window === "undefined" ? memoryStore() : browserStore(),
    seed: () => buildSeed(koreaDate()),
    listenStorageEvents: true,
  }));
  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>;
}

export function useRepo(): Repository {
  const r = useContext(RepoContext);
  if (!r) throw new Error("DataProvider 밖에서 useRepo 사용");
  return r;
}
