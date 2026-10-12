import type { Repository } from "@/data/repository";
import { createMockRepository } from "@/data/mockRepository";
import { browserStore } from "@/data/storage";
import { buildSeed } from "@/data/seed";
import { classifySource, detectBrowser, detectDevice, isBot, normalizeVisitPath } from "@/domain/analytics";
import { koreaDate } from "@/domain/dates";

const VISITOR_KEY = "gn-visitor";
const EXCLUDE_KEY = "gn-exclude-stats";

let fallbackRepo: Repository | null = null;
function defaultRepo(): Repository {
  fallbackRepo ??= createMockRepository({ store: browserStore(), seed: () => buildSeed(koreaDate()) });
  return fallbackRepo;
}

function visitorId(): string {
  const store = browserStore();
  let id = store.getItem(VISITOR_KEY);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    store.setItem(VISITOR_KEY, id);
  }
  return id;
}

/**
 * 브라우저 전용 방문 기록(익명, 같은 방문자는 하루 1문서).
 * `/admin` 경로·관리자 로그인 브라우저(gn-exclude-stats)·봇은 기록하지 않는다.
 * 화면에서는 `trackPageView(path, useRepo())`처럼 같은 저장소를 넘기면 통계 화면이 바로 갱신된다.
 * 실패해도 페이지 동작을 막지 않는다.
 */
export async function trackPageView(path: string, repo?: Repository): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (path.startsWith("/admin")) return;
    path = normalizeVisitPath(path);
    if (browserStore().getItem(EXCLUDE_KEY) === "1") return;
    const ua = window.navigator.userAgent;
    if (isBot(ua, window.navigator.webdriver === true)) return;
    const r = repo ?? defaultRepo(); // 브라우저 확인 뒤에만 기본 저장소를 만든다
    const vid = visitorId(); const date = koreaDate(); const id = `${date}_${vid}`;
    const existing = await r.get("visits", id);
    if (existing) {
      if (!existing.pages.includes(path)) await r.update("visits", id, { pages: [...existing.pages, path] });
      return;
    }
    const referrer = document.referrer;
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    await r.create("visits", {
      id, date, visitorId: vid, pages: [path], referrer,
      source: classifySource(referrer, utm), device: detectDevice(window.innerWidth, ua), browser: detectBrowser(ua),
    });
  } catch {
    /* 통계 기록 실패는 무시 */
  }
}
