import { describe, it, expect, afterEach } from "vitest";
import { browserStore } from "./storage";

const g = globalThis as { window?: unknown };
afterEach(() => { delete g.window; });

describe("browserStore", () => {
  it("localStorage를 못 쓰면 같은 메모리 저장소를 계속 재사용한다", () => {
    g.window = {}; // localStorage 없음 → 접근 시 오류
    const a = browserStore(); a.setItem("gn-demo-admin", "kim");
    const b = browserStore();
    expect(b).toBe(a);
    expect(b.getItem("gn-demo-admin")).toBe("kim");
  });
});
