export const STAT_GREEN = "#2F8F57";
export const STAT_BLUE = "#2F6DB5";
export const STAT_AMBER = "#B7791F";
export const GRID = "#E3E8E4";
export const MUTED = "#56645C";
export const PAGE_NAME: Record<string, string> = {
  "/": "홈", "/portfolio": "포트폴리오", "/about": "회사·서비스 소개", "/news": "소식·공지", "/contact": "견적·문의", "/contact/done": "문의 완료",
};
export const pageName = (path: string) => PAGE_NAME[path] ?? path;
export const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
export const num = (n: number) => n.toLocaleString("ko-KR");
