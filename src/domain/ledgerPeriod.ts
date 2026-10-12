import type { ISODate } from "./types";
import { addDays, isValidISODate } from "./dates";

export type PeriodKind = "month" | "lastMonth" | "quarter" | "year" | "custom";
export const PERIOD_LABEL: Record<PeriodKind, string> = { month: "이번 달", lastMonth: "지난 달", quarter: "이번 분기", year: "올해", custom: "직접" };
export const PERIOD_ORDER: PeriodKind[] = ["month", "lastMonth", "quarter", "year", "custom"];
export const isPeriodKind = (v: string | null): v is PeriodKind => !!v && (PERIOD_ORDER as string[]).includes(v);

const monthEnd = (ym: string): ISODate => {
  const [y, m] = ym.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return addDays(next as ISODate, -1);
};
/** YYYY-MM에 n달을 더한다(음수 가능). */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

/** 기간 종류 → 시작·끝 날짜(끝 날짜 포함). 직접은 잘못된 값이면 이번 달로 대신하고, 시작>끝이면 바꿔 준다. */
export function periodRange(kind: PeriodKind, today: ISODate, custom?: { from?: string; to?: string }): { from: ISODate; to: ISODate } {
  const ym = today.slice(0, 7), y = today.slice(0, 4);
  switch (kind) {
    case "month": return { from: `${ym}-01`, to: monthEnd(ym) };
    case "lastMonth": { const p = addMonths(ym, -1); return { from: `${p}-01`, to: monthEnd(p) }; }
    case "quarter": { const qStart = addMonths(`${y}-01`, Math.floor((Number(ym.slice(5)) - 1) / 3) * 3); return { from: `${qStart}-01`, to: monthEnd(addMonths(qStart, 2)) }; }
    case "year": return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "custom": {
      const f = custom?.from && isValidISODate(custom.from) ? custom.from : null;
      const t = custom?.to && isValidISODate(custom.to) ? custom.to : null;
      if (!f && !t) return periodRange("month", today);
      const a = f ?? t!, b = t ?? f!;
      return a <= b ? { from: a, to: b } : { from: b, to: a };
    }
  }
}

/** 월별 차트에 쓸 달 목록. 기간이 한 달 이하면 끝 달까지 최근 6개월, 그보다 길면 기간의 달들(최대 최근 12개월). */
export function chartMonths(from: ISODate, to: ISODate): string[] {
  const a = from.slice(0, 7), b = to.slice(0, 7);
  const out: string[] = [];
  for (let m = a; m <= b && out.length < 600; m = addMonths(m, 1)) out.push(m);
  if (out.length <= 1) return Array.from({ length: 6 }, (_, i) => addMonths(b, i - 5));
  return out.slice(-12);
}
