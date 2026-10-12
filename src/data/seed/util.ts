import type { AdminId, Attachment, Base, ISODate, ISOTime } from "@/domain/types";
import { addDays } from "@/domain/dates";

export type Rng = () => number;

/** 결정적 난수(같은 시드 → 같은 순서). */
export function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
export function weighted<T>(rng: Rng, table: readonly (readonly [T, number])[]): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of table) { r -= w; if (r < 0) return v; }
  return table[table.length - 1][0];
}

/** 시드 생성 문맥: 모든 날짜·시각은 today 기준 상대값으로만 만든다(현재 시각 사용 금지). */
export interface SeedCtx {
  today: ISODate;
  rng: Rng;
  day(offset: number): ISODate;
  /** today+offset일의 한국 시각 hh:mm → ISO(UTC) */
  at(offset: number, hh?: number, mm?: number): ISOTime;
}
export function makeCtx(today: ISODate, seed = 20261011): SeedCtx {
  const day = (offset: number) => addDays(today, offset);
  return {
    today, rng: mulberry32(seed), day,
    at: (offset, hh = 10, mm = 0) => new Date(`${day(offset)}T${pad(hh)}:${pad(mm)}:00+09:00`).toISOString(),
  };
}

export function base(id: string, createdAt: ISOTime, updatedAt: ISOTime = createdAt): Base {
  return { id, createdAt, updatedAt, version: 1 };
}

export function image(id: string, url: string, name: string, by: AdminId | "web", at: ISOTime): Attachment {
  return { id, name, mime: "image/svg+xml", url, size: 24_000, uploadedBy: by, at };
}

/** 고객 n(1부터)과 샘플 이미지 pfNN 번호는 같은 순서다. */
export const pfImage = (n: number, v: 1 | 2 | 3) => `/samples/pf${pad(n)}-${v}.svg`;
