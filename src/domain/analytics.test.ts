import { describe, it, expect } from "vitest";
import { normalizeVisitPath, classifySource, detectDevice, isBot, uniqueVisits, visitorSummary, dailySeries, pageStats, conversionRate } from "./analytics";
import { toCsv } from "./csv";
import type { Visit } from "./types";

const v = (date: string, visitorId: string, o: Partial<Visit> = {}): Visit => ({ id: `${date}_${visitorId}`, createdAt: `${date}T01:00:00Z`, updatedAt: `${date}T01:00:00Z`, version: 1, date, visitorId, pages: ["/"], referrer: "", source: "direct", device: "mobile", browser: "Chrome", ...o });

describe("analytics", () => {
  it("유입 경로 분류", () => {
    expect(classifySource("https://search.naver.com/search.naver?q=간판")).toBe("naver");
    expect(classifySource("https://m.blog.naver.com/abc")).toBe("naver_blog");
    expect(classifySource("https://map.naver.com/p/entry/place/1")).toBe("naver_blog");
    expect(classifySource("https://www.google.com/")).toBe("google");
    expect(classifySource("https://search.daum.net/x")).toBe("daum");
    expect(classifySource("https://l.instagram.com/")).toBe("instagram");
    expect(classifySource("")).toBe("direct");
    expect(classifySource("https://somewhere.kr")).toBe("other");
    expect(classifySource("", "instagram")).toBe("instagram");
  });
  it("기기·봇", () => {
    expect(detectDevice(390, "Mozilla/5.0 (iPhone)")).toBe("mobile");
    expect(detectDevice(820, "Mozilla/5.0 (iPad)")).toBe("tablet");
    expect(detectDevice(1440, "Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("Mozilla/5.0", true)).toBe(true);
    expect(isBot("Mozilla/5.0")).toBe(false);
  });
  const visits = [
    v("2026-10-11", "a"), v("2026-10-11", "a"), v("2026-10-11", "b"), v("2026-10-11", "admin1"),
    v("2026-10-10", "a"), v("2026-10-06", "c", { pages: ["/", "/contact/done"] }), v("2026-10-01", "d"),
  ];
  it("같은 방문자는 하루 1회, 관리자 제외", () => {
    expect(uniqueVisits(visits, ["admin1"])).toHaveLength(5);
  });
  it("요약: 오늘/주간(고유)/전체(고유)", () => {
    expect(visitorSummary(visits, "2026-10-11", ["admin1"])).toEqual({ today: 2, yesterday: 1, week: 3, prevWeek: 1, total: 4, totalVisits: 5 });
  });
  it("일별 시리즈", () => {
    const s = dailySeries(visits, "2026-10-11", 3, ["admin1"]);
    expect(s).toEqual([{ date: "2026-10-09", visitors: 0 }, { date: "2026-10-10", visitors: 1 }, { date: "2026-10-11", visitors: 2 }]);
  });
  it("페이지별·전환율", () => {
    const u = uniqueVisits(visits, ["admin1"]);
    expect(pageStats(u)[0]).toEqual({ key: "/", visitors: 5, share: 1 });
    expect(conversionRate(u)).toBeCloseTo(0.2);
  });
});

describe("경로 정규화", () => {
  it("끝 슬래시를 없애고 루트는 유지한다", () => {
    expect(normalizeVisitPath("/contact/done/")).toBe("/contact/done");
    expect(normalizeVisitPath("/")).toBe("/");
    expect(normalizeVisitPath("/about")).toBe("/about");
  });
  it("전환율·페이지 집계가 두 표기를 같게 본다", () => {
    const vs = [v("2026-10-01", "a", { pages: ["/", "/contact/done/"] }), v("2026-10-01", "b", { pages: ["/contact/done"] }), v("2026-10-01", "c", { pages: ["/portfolio/", "/portfolio"] }), v("2026-10-01", "d")];
    expect(conversionRate(vs)).toBe(0.5);
    const ps = pageStats(vs);
    expect(ps.find(p => p.key === "/contact/done")?.visitors).toBe(2);
    expect(ps.find(p => p.key === "/portfolio")?.visitors).toBe(1);
  });
});

describe("csv", () => {
  it("BOM·따옴표 이스케이프", () => {
    const s = toCsv([{ a: "x,y", b: 'say "hi"', c: 3 }], [{ key: "a", label: "가" }, { key: "b", label: "나" }, { key: "c", label: "다" }]);
    expect(s).toBe('﻿가,나,다\r\n"x,y","say ""hi""",3\r\n');
  });
});
