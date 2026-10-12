import type { Device, Visit, VisitSource } from "@/domain/types";
import { addDays } from "@/domain/dates";
import { base, int, pad, pick, weighted, type SeedCtx } from "./util";

export const ADMIN_VISITOR_IDS = ["admin-kim", "admin-choi"];

const SOURCES: [VisitSource, number][] = [["naver", 40], ["naver_blog", 15], ["direct", 20], ["google", 10], ["instagram", 8], ["daum", 4], ["other", 3]];
const DEVICES: [Device, number][] = [["mobile", 68], ["desktop", 26], ["tablet", 6]];
const REFERRER: Record<VisitSource, string> = {
  naver: "https://search.naver.com/",
  naver_blog: "https://blog.naver.com/greennarae-demo",
  google: "https://www.google.com/",
  daum: "https://search.daum.net/",
  instagram: "https://www.instagram.com/",
  direct: "",
  other: "https://www.example.com/",
};
const BROWSERS: Record<Device, string[]> = {
  mobile: ["Chrome", "Samsung Internet", "Safari", "Safari", "Whale"],
  desktop: ["Chrome", "Chrome", "Edge", "Whale"],
  tablet: ["Safari", "Chrome"],
};
const PAGES = ["/portfolio", "/about", "/news", "/contact"];

function pagesFor(ctx: SeedCtx): string[] {
  const { rng } = ctx;
  const pages = [rng() < 0.85 ? "/" : pick(rng, PAGES)];
  const extra = int(rng, 0, 2);
  for (let i = 0; i < extra; i++) { const p = pick(rng, PAGES); if (!pages.includes(p)) pages.push(p); }
  if (rng() < 0.04) { if (!pages.includes("/contact")) pages.push("/contact"); pages.push("/contact/done"); }
  return pages;
}

/** 방문 90일: 날짜별 고유 방문자 20~70명(주말 낮게, 최근 증가), 같은 방문자 중복 문서 일부, 관리자 방문 포함 */
export function buildVisits(ctx: SeedCtx): Visit[] {
  const { rng, today } = ctx;
  const visits: Visit[] = [];
  const doc = (date: string, visitorId: string, suffix: string, source: VisitSource, device: Device, pages: string[]) => {
    const at = new Date(`${date}T${pad(int(rng, 8, 23))}:${pad(int(rng, 0, 59))}:00+09:00`).toISOString();
    visits.push({ ...base(`${date}_${visitorId}${suffix}`, at), date, visitorId, pages, referrer: REFERRER[source], source, device, browser: pick(rng, BROWSERS[device]) });
  };
  for (let i = 0; i < 90; i++) {
    const date = addDays(today, i - 89);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const trend = 26 + (34 * i) / 89;
    const count = Math.max(20, Math.min(70, Math.round(trend * (weekend ? 0.72 : 1) + int(rng, -5, 5))));
    const pool = 300 + i * 12;
    const seen = new Set<string>();
    while (seen.size < count) {
      const visitorId = `v${pad(int(rng, 1, pool), 4)}`;
      if (seen.has(visitorId)) continue;
      seen.add(visitorId);
      const source = weighted(rng, SOURCES), device = weighted(rng, DEVICES);
      doc(date, visitorId, "", source, device, pagesFor(ctx));
      // 같은 방문자가 같은 날 다시 기록된 문서(통계에서는 하루 1회로 센다)
      if (rng() < 0.03) doc(date, visitorId, "_2", source, device, ["/"]);
    }
    if (!weekend) doc(date, "admin-kim", "", "direct", "desktop", ["/"]);
    if (i % 3 === 0) doc(date, "admin-choi", "", "direct", "mobile", ["/", "/portfolio"]);
  }
  return visits;
}
