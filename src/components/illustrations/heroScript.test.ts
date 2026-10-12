import { describe, it, expect } from "vitest";
import { HERO_SCRIPT, HERO_CYCLE_SECONDS } from "./heroScript";
describe("hero script", () => {
  it("대사 5쌍, 20초 사이클(4초 간격)", () => {
    expect(HERO_SCRIPT).toHaveLength(5);
    expect(HERO_CYCLE_SECONDS).toBe(20);
    expect(HERO_SCRIPT[3]).toEqual({ designer: "불 한번 켜볼까요?", installer: "점등! ✨" });
  });
});
