"use client";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { DEVICE_LABEL } from "@/domain/defaults";
import type { Device } from "@/domain/types";
import { STAT_AMBER, STAT_BLUE, STAT_GREEN, num, pct } from "./statsShared";
import type { BreakRow } from "./SourceChart";

const ORDER: Device[] = ["mobile", "tablet", "desktop"];
const COLOR: Record<Device, string> = { mobile: STAT_GREEN, tablet: STAT_AMBER, desktop: STAT_BLUE };

/** 기기 도넛(모바일·태블릿·PC) + 브라우저 상위 3 표. */
export function DeviceChart({ devices, browsers, total }: { devices: BreakRow[]; browsers: BreakRow[]; total: number }) {
  const by = new Map(devices.map(r => [r.key, r]));
  const items = ORDER.map(k => ({ key: k, name: DEVICE_LABEL[k], visitors: by.get(k)?.visitors ?? 0, share: by.get(k)?.share ?? 0 }));
  const data = items.filter(i => i.visitors > 0);
  return (
    <section className="min-w-0 rounded-xl border border-[#E3E8E4] bg-white p-3 md:p-4">
      <h2 className="text-sm font-bold">기기와 브라우저</h2>
      <p className="mb-3 text-xs text-[#56645C]">최근 90일 · 방문 {num(total)}회 기준</p>
      <div className="flex flex-wrap items-center gap-4">
        <div role="img" aria-label={`기기 비율 도넛 차트: ${items.map(i => `${i.name} ${pct(i.share)}`).join(", ")}`} className="relative size-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.length ? data : [{ key: "none", visitors: 1 }]} dataKey="visitors" innerRadius="62%" outerRadius="100%" paddingAngle={data.length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                {data.length ? data.map(d => <Cell key={d.key} fill={COLOR[d.key]} />) : <Cell fill="#EEF1EF" />}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-lg font-bold tabular-nums">{num(total)}</span><span className="text-[11px] text-[#56645C]">방문</span></div>
        </div>
        <ul className="min-w-[10rem] flex-1 space-y-2 text-sm">
          {items.map(i => (
            <li key={i.key} className="flex items-center gap-2">
              <span aria-hidden className="inline-block size-3 shrink-0 rounded-sm" style={{ background: COLOR[i.key] }} />
              <span className="min-w-0 flex-1 truncate">{i.name}</span>
              <span className="whitespace-nowrap tabular-nums"><span className="font-bold">{pct(i.share)}</span><span className="ml-1 text-xs text-[#56645C]">{num(i.visitors)}명</span></span>
            </li>
          ))}
        </ul>
      </div>
      <h3 className="mb-1 mt-4 text-xs font-bold text-[#56645C]">브라우저 상위 3</h3>
      <table className="w-full text-sm"><caption className="sr-only">브라우저 상위 3</caption>
        <tbody>
          {browsers.slice(0, 3).map((b, idx) => (
            <tr key={b.key} className="border-t border-[#EEF1EF]">
              <th scope="row" className="py-1.5 text-left font-medium"><span className="mr-2 text-xs text-[#7A867F]">{idx + 1}</span>{b.key}</th>
              <td className="py-1.5 text-right tabular-nums"><span className="font-bold">{pct(b.share)}</span><span className="ml-1 text-xs text-[#56645C]">{num(b.visitors)}명</span></td>
            </tr>
          ))}
          {browsers.length === 0 && <tr><td className="py-2 text-[#56645C]">기록이 없어요.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
