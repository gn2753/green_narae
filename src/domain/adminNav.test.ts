import { describe, expect, it } from "vitest";
import { formatMoneyInput, isMenuActive, normalizePath, parseMoneyInput, safeNextPath } from "./adminNav";

describe("safeNextPath", () => {
  it("관리자 경로는 그대로 돌려준다", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/customers")).toBe("/admin/customers");
    expect(safeNextPath("/admin/customers/")).toBe("/admin/customers/");
    expect(safeNextPath("/admin/customers?id=c1")).toBe("/admin/customers?id=c1");
    expect(safeNextPath("/admin?x=1#a")).toBe("/admin?x=1#a");
  });
  it("없거나 관리자 밖 경로는 /admin", () => {
    for (const v of [null, undefined, "", "admin", "/", "/about", "/administrator", "/adminx/a", "https://evil.example/admin", "//evil.example", "javascript:alert(1)"]) {
      expect(safeNextPath(v)).toBe("/admin");
    }
  });
  it("우회 시도는 /admin", () => {
    for (const v of ["/admin//evil.example", "/admin/\\evil.example", "/admin/../about", "/admin/./x", "/admin/%2e%2e/about", "/admin/%2E./about", "/admin/\nx", "/admin/login", "/admin/login/", "/admin/login?next=/admin"]) {
      expect(safeNextPath(v)).toBe("/admin");
    }
  });
});

describe("isMenuActive", () => {
  it("대시보드는 정확히 같을 때만", () => {
    expect(isMenuActive("/admin", "/admin")).toBe(true);
    expect(isMenuActive("/admin/", "/admin")).toBe(true);
    expect(isMenuActive("/admin/tasks", "/admin")).toBe(false);
  });
  it("하위 경로와 함께 강조할 경로", () => {
    expect(isMenuActive("/admin/tasks/", "/admin/tasks")).toBe(true);
    expect(isMenuActive("/admin/projects", "/admin/tasks", ["/admin/projects"])).toBe(true);
    expect(isMenuActive("/admin/tasksx", "/admin/tasks")).toBe(false);
  });
  it("normalizePath", () => {
    expect(normalizePath("/admin/x/")).toBe("/admin/x");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/admin?id=1")).toBe("/admin");
  });
});

describe("금액 입력", () => {
  it("콤마 표시", () => {
    expect(formatMoneyInput(3200000)).toBe("3,200,000");
    expect(formatMoneyInput(0)).toBe("0");
  });
  it("숫자만 읽는다", () => {
    expect(parseMoneyInput("3,200,000원")).toBe(3200000);
    expect(parseMoneyInput("")).toBe(0);
    expect(parseMoneyInput("abc")).toBe(0);
    expect(parseMoneyInput("0012")).toBe(12);
    expect(parseMoneyInput("9".repeat(20))).toBe(999999999999999);
  });
});
