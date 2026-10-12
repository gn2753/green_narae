import {
  BarChart3, CalendarDays, ClipboardList, Factory, FileSignature, Globe, LayoutDashboard,
  MessageSquare, Printer, ReceiptText, Settings, Users, Wallet, type LucideIcon,
} from "lucide-react";

export type AdminMenuGroup = "업무·고객 관리" | "제작·매입매출·정산" | "고객 응대·홈페이지 운영" | "추가";

export interface AdminMenuItem {
  /** 메뉴 ID(A01…A12, 방문 통계는 "stats") */
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** 이 메뉴를 함께 강조할 다른 경로(예: 업무·일정 ↔ 의뢰 진행) */
  also?: string[];
}

/** 관리자 메뉴(사이드바·전체 메뉴 시트·자리 표시 화면 제목이 모두 이 목록을 쓴다). */
export const ADMIN_MENU: { group: AdminMenuGroup; items: AdminMenuItem[] }[] = [
  {
    group: "업무·고객 관리",
    items: [
      { id: "A01", label: "대시보드", href: "/admin", icon: LayoutDashboard },
      { id: "A02", label: "업무·일정", href: "/admin/tasks", icon: ClipboardList, also: ["/admin/projects"] },
      { id: "A03", label: "고객리스트", href: "/admin/customers", icon: Users },
      { id: "A04", label: "견적·계약", href: "/admin/contracts", icon: FileSignature },
    ],
  },
  {
    group: "제작·매입매출·정산",
    items: [
      { id: "A05", label: "제작업체·발주", href: "/admin/orders", icon: Factory },
      { id: "A06", label: "매입·매출", href: "/admin/ledger", icon: ReceiptText },
      { id: "A07", label: "계약금·잔금", href: "/admin/payments", icon: Wallet },
      { id: "A08", label: "자료·인쇄", href: "/admin/print", icon: Printer },
    ],
  },
  {
    group: "고객 응대·홈페이지 운영",
    items: [
      { id: "A09", label: "고객 문의·답변", href: "/admin/inquiries", icon: MessageSquare },
      { id: "A10", label: "홈페이지 콘텐츠", href: "/admin/content", icon: Globe },
      { id: "A11", label: "달력·알림", href: "/admin/calendar", icon: CalendarDays },
      { id: "A12", label: "사용자·권한", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    group: "추가",
    items: [{ id: "stats", label: "방문 통계", href: "/admin/stats", icon: BarChart3 }],
  },
];

/** 모든 메뉴 항목(그룹 순서대로) */
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = ADMIN_MENU.flatMap(g => g.items);

/** ID로 메뉴 항목 찾기 */
export function adminMenuItem(id: string): AdminMenuItem | undefined {
  return ADMIN_MENU_ITEMS.find(i => i.id === id);
}

/** 문의 메뉴 ID(미답변 배지를 붙인다) */
export const INQUIRY_MENU_ID = "A09";

/** 업무·일정(A02) 화면 탭 — 파트별 업무 / 의뢰 진행(`<PageHeader tabs>`에 넘긴다) */
export const TASK_TABS: { label: string; href: string }[] = [
  { label: "파트별 업무", href: "/admin/tasks" },
  { label: "의뢰 진행", href: "/admin/projects" },
];
