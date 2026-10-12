import { describe, it, expect } from "vitest";
import { formatWon, formatDateKo, formatPhone } from "./format";

describe("format", () => {
  it("formatWon", () => { expect(formatWon(3200000)).toBe("3,200,000원"); expect(formatWon(0)).toBe("0원"); });
  it("formatDateKo", () => { expect(formatDateKo("2026-10-11")).toBe("10월 11일 (일)"); });
  it("formatPhone", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
    expect(formatPhone("0441234567")).toBe("044-123-4567");
    expect(formatPhone("010-1234-5678")).toBe("010-1234-5678");
  });
});
