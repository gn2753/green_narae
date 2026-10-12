import type { Device, ISODate, Visit, VisitSource } from "./types";
import { addDays } from "./dates";

export function classifySource(referrer: string, utmSource?: string | null): VisitSource {
  const utm = utmSource?.toLowerCase();
  if (utm) { if (utm.includes("insta")) return "instagram"; if (utm.includes("blog")) return "naver_blog"; if (utm.includes("naver")) return "naver"; if (utm.includes("google")) return "google"; if (utm.includes("daum") || utm.includes("kakao")) return "daum"; }
  if (!referrer) return "direct";
  let host = ""; try { host = new URL(referrer).hostname; } catch { return "other"; }
  if (/(^|\.)blog\.naver\.com$|(^|\.)map\.naver\.com$|place\.naver\.com$/.test(host)) return "naver_blog";
  if (/naver\.com$/.test(host)) return "naver";
  if (/google\./.test(host)) return "google";
  if (/daum\.net$|kakao\.com$/.test(host)) return "daum";
  if (/instagram\.com$/.test(host)) return "instagram";
  return "other";
}
export function detectDevice(width: number, ua: string): Device {
  if (/iPad|Tablet/i.test(ua) || (width >= 768 && width < 1024 && /Android|Mobile/i.test(ua))) return "tablet";
  if (/iPhone|Android.+Mobile|Mobile/i.test(ua) || width < 768) return "mobile";
  return "desktop";
}
export function detectBrowser(ua: string): string {
  if (/Whale/i.test(ua)) return "Whale"; if (/SamsungBrowser/i.test(ua)) return "Samsung Internet"; if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome"; if (/Safari\//.test(ua)) return "Safari"; if (/Firefox\//.test(ua)) return "Firefox"; return "기타";
}
export function isBot(ua: string, webdriver = false) { return webdriver || /bot|crawl|spider|slurp|headless|lighthouse/i.test(ua); }

export function uniqueVisits(visits: Visit[], excluded: string[]): Visit[] {
  const ex = new Set(excluded), seen = new Set<string>();
  return visits.filter(v => { const k = `${v.date}_${v.visitorId}`; if (ex.has(v.visitorId) || seen.has(k)) return false; seen.add(k); return true; });
}
const uniqIds = (vs: Visit[]) => new Set(vs.map(v => v.visitorId)).size;
export function visitorSummary(visits: Visit[], today: ISODate, excluded: string[]) {
  const u = uniqueVisits(visits, excluded);
  const inRange = (from: ISODate, to: ISODate) => u.filter(v => v.date >= from && v.date <= to);
  return {
    today: inRange(today, today).length,
    yesterday: inRange(addDays(today, -1), addDays(today, -1)).length,
    week: uniqIds(inRange(addDays(today, -6), today)),
    prevWeek: uniqIds(inRange(addDays(today, -13), addDays(today, -7))),
    total: uniqIds(u),
    totalVisits: u.length,
  };
}
export function dailySeries(visits: Visit[], today: ISODate, days: number, excluded: string[]) {
  const u = uniqueVisits(visits, excluded);
  return Array.from({ length: days }, (_, i) => { const date = addDays(today, i - days + 1); return { date, visitors: u.filter(v => v.date === date).length }; });
}
export function breakdown(visits: Visit[], key: (v: Visit) => string[] | string) {
  const counts = new Map<string, number>();
  for (const v of visits) for (const k of new Set([key(v)].flat())) counts.set(k, (counts.get(k) ?? 0) + 1);
  const total = visits.length || 1;
  return [...counts].map(([k, visitors]) => ({ key: k, visitors, share: visitors / total })).sort((a, b) => b.visitors - a.visitors);
}
/** 경로 정규화: 끝의 슬래시를 없앤다(루트 "/" 제외). "/contact/done/" → "/contact/done" */
export function normalizeVisitPath(path: string): string {
  const p = path.trim().split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") || "/" : p;
}
export const pageStats = (visits: Visit[]) => breakdown(visits, v => v.pages.map(normalizeVisitPath));
export function convertedCount(visits: Visit[]) { return visits.filter(v => v.pages.some(p => normalizeVisitPath(p) === "/contact/done")).length; }
export function conversionRate(visits: Visit[]) { return visits.length ? convertedCount(visits) / visits.length : 0; }
