import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  const cols = [{ key: "a", label: "값" }];
  it("BOM과 따옴표 이스케이프", () => {
    expect(toCsv([{ a: 'x,"y"' }], cols)).toBe('﻿값\r\n"x,""y"""\r\n');
  });
  it("수식으로 시작하는 문자열은 작은따옴표를 붙인다", () => {
    const out = toCsv([{ a: '=HYPERLINK("http://x")' }, { a: "+1" }, { a: "-2" }, { a: "@s" }], cols);
    expect(out).toContain('"\'=HYPERLINK(""http://x"")"');
    expect(out).toContain("'+1\r\n'-2\r\n'@s");
  });
  it("숫자는 음수여도 그대로", () => {
    expect(toCsv([{ a: -5000 }], cols)).toBe("﻿값\r\n-5000\r\n");
  });
});
