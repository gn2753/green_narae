export const SITE_INFO = {
  name: "그린나래디자인",
  ceo: "대표이사 김자연",
  address: "세종특별자치시 ○○로 00",
  phone: "010-0000-0000",
  email: "hello@greennarae.example",
  hours: "평일 09:00 – 18:00 (토·일·공휴일 휴무)",
  bizNo: "000-00-00000",
  /** 사이트 대표 주소. 1차는 공개 시안, 2차 운영 시 Firebase Hosting(→ 정식 도메인)으로 교체. */
  url: "https://gn2753.github.io/green_narae/",
} as const;

export const NAV_ITEMS = [
  { href: "/about", label: "회사·서비스 소개" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/news", label: "소식·공지" },
  { href: "/contact", label: "견적·문의" },
] as const;
