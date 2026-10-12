import { describe, it, expect } from "vitest";
import { koreaDate, addDays, daysBetween, startOfWeek, monthKey, isValidISODate } from "./dates";

describe("dates", () => {
  it("koreaDate는 서울 시간 기준 날짜", () => {
    expect(koreaDate(new Date("2026-10-10T15:30:00Z"))).toBe("2026-10-11"); // KST 00:30
    expect(koreaDate(new Date("2026-10-10T14:59:00Z"))).toBe("2026-10-10");
  });
  it("addDays는 월·연 경계를 넘는다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("daysBetween", () => {
    expect(daysBetween("2026-10-01", "2026-10-11")).toBe(10);
    expect(daysBetween("2026-10-11", "2026-10-01")).toBe(-10);
  });
  it("startOfWeek는 월요일", () => {
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // 일요일 → 그 주 월요일
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12");
  });
  it("monthKey", () => { expect(monthKey("2026-10-11")).toBe("2026-10"); });
  it("isValidISODate: 범위·실제 날짜 확인", () => {
    expect(isValidISODate("2026-10-21")).toBe(true);
    expect(isValidISODate("0002-10-21")).toBe(false);
    expect(isValidISODate("2101-01-01")).toBe(false);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("")).toBe(false);
  });
});
