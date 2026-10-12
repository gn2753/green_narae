/** 관리자 화면 이동에 쓰는 순수 함수들(브라우저 API 없음). */

/** 끝의 `/`를 떼어 경로를 비교하기 쉽게 만든다(`trailingSlash: true` 대응). 루트 `/`는 그대로. */
export function normalizePath(path: string): string {
  const p = path.split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") || "/" : p;
}

/**
 * 로그인 뒤 돌아갈 경로를 검사한다. 같은 사이트의 `/admin…` 경로만 허용하고
 * (외부 주소·`//host`·역슬래시·`..`·로그인 화면 자신·제어 문자) 나머지는 모두 `/admin`으로 돌린다.
 */
export function safeNextPath(next: string | null | undefined): string {
  const fallback = "/admin";
  if (!next || typeof next !== "string") return fallback;
  if (!/^\/admin(?=$|[/?#])/.test(next)) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(next) || next.includes("//")) return fallback;
  const path = next.split(/[?#]/)[0];
  // 브라우저는 `%2e%2e`도 `..`로 해석하므로 함께 막는다.
  if (path.split("/").some(seg => { const d = seg.toLowerCase().replace(/%2e/g, "."); return d === ".." || d === "."; })) return fallback;
  if (normalizePath(path) === "/admin/login") return fallback;
  return next;
}

/** 현재 경로가 메뉴(href, 함께 강조할 경로 also)에 해당하는지. `/admin`(대시보드)은 정확히 같을 때만. */
export function isMenuActive(pathname: string, href: string, also: readonly string[] = []): boolean {
  const p = normalizePath(pathname);
  return [href, ...also].some(h => {
    const t = normalizePath(h);
    return t === "/admin" ? p === t : p === t || p.startsWith(t + "/");
  });
}

/** 금액 입력칸 표시값: 정수에 천 단위 콤마(0이면 빈칸 대신 "0"). */
export function formatMoneyInput(n: number): string {
  if (!Number.isFinite(n)) return "";
  return Math.trunc(n).toLocaleString("ko-KR");
}

/** 금액 입력칸 글자 → 원 단위 정수(숫자 외 문자는 무시, 빈칸은 0, 최대 999조 미만). */
export function parseMoneyInput(text: string): number {
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
  return digits ? Number(digits) : 0;
}
