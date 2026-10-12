export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** 정적 파일 경로에 GitHub Pages basePath를 붙인다. */
export function asset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${BASE_PATH}${path}`;
}
