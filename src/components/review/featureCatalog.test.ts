import { describe, it, expect } from "vitest";
import { FEATURES, DECISIONS } from "./featureCatalog";

describe("feature catalog", () => {
  it("사이트맵의 모든 화면 ID를 포함", () => {
    const ids = FEATURES.map((f) => f.id);
    for (const id of ["P01", "P02", "P03", "P04", "P05", "A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10", "A11", "A12", "STATS"]) expect(ids).toContain(id);
    expect(ids).not.toContain("A13");
  });
  it("모든 항목에 경로와 단계 표기", () => {
    FEATURES.forEach((f) => {
      expect(f.path.startsWith("/")).toBe(true);
      expect(f.items.length).toBeGreaterThan(0);
    });
  });
  it("결정 필요 항목에 Google Calendar 포함", () => {
    expect(DECISIONS.some((d) => d.title.includes("Google Calendar"))).toBe(true);
  });
  it("단계 표기가 스펙과 일치", () => {
    const phase = (id: string, text: string) => FEATURES.find((f) => f.id === id)?.items.find((i) => i.text.includes(text))?.phase;
    expect(phase("A08", "CSV")).toBe("1차 동작");
    expect(phase("A11", "9:30 요약 발송")).toBe("2차");
    expect(phase("A11", "9:30 요약 설정")).toBe("1차 화면");
    expect(phase("A09", "이메일 답장")).toBe("2차");
    expect(phase("STATS", "실제 수집")).toBe("2차");
  });
});
