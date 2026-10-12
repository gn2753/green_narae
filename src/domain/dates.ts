import type { ISODate } from "./types";
export function koreaDate(d: Date = new Date()): ISODate {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  return ["year", "month", "day"].map(k => p.find(x => x.type === k)!.value).join("-");
}
const noon = (day: ISODate) => new Date(`${day}T12:00:00Z`);
export function addDays(day: ISODate, n: number): ISODate { const d = noon(day); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function daysBetween(from: ISODate, to: ISODate): number { return Math.round((noon(to).getTime() - noon(from).getTime()) / 86_400_000); }
export function startOfWeek(day: ISODate): ISODate { const dow = noon(day).getUTCDay(); return addDays(day, dow === 0 ? -6 : 1 - dow); }
export function monthKey(day: ISODate): string { return day.slice(0, 7); }
/** 입력 가능한 날짜인가: 실제 있는 YYYY-MM-DD이고 2000-01-01 ~ 2100-12-31 */
export function isValidISODate(v: string): v is ISODate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < "2000-01-01" || v > "2100-12-31") return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
