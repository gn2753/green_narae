const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  // 엑셀 수식 주입 방지: 문자열만 처리(숫자는 음수도 그대로)
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  return "﻿" + [columns.map(c => cell(c.label)).join(","), ...rows.map(r => columns.map(c => cell(r[c.key])).join(","))].map(l => l + "\r\n").join("");
}
