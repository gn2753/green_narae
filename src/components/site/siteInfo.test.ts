import { describe, expect, it } from "vitest";
import { SITE_INFO } from "./siteInfo";

describe("SITE_INFO.url", () => {
  it("현재 공개 시안 주소(고객 계정)를 가리킨다", () => {
    expect(SITE_INFO.url).toBe("https://gn2753.github.io/green_narae/");
  });
  it("https 절대 주소이고 /로 끝난다", () => {
    expect(SITE_INFO.url).toMatch(/^https:\/\/.+\/$/);
  });
});
