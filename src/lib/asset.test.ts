import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("asset", () => {
  it("basePath가 없으면 경로 그대로", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const { asset } = await import("./asset");
    expect(asset("/samples/a.svg")).toBe("/samples/a.svg");
  });
  it("basePath를 앞에 붙인다", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/green_narae");
    const { asset } = await import("./asset");
    expect(asset("/samples/a.svg")).toBe("/green_narae/samples/a.svg");
  });
  it("data:, blob:, http 주소는 건드리지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/green_narae");
    const { asset } = await import("./asset");
    expect(asset("data:image/png;base64,xx")).toBe("data:image/png;base64,xx");
    expect(asset("blob:abc")).toBe("blob:abc");
    expect(asset("https://x.y/z.png")).toBe("https://x.y/z.png");
  });
});
