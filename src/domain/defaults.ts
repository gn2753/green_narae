import type { Admin, AdminId, Settings, StageKey, TaskCategory, Priority, TaskStatus, InquirySource, ReplyChannel, ContractStatus, OrderStatus, PaymentKind, NewsCategory, VisitSource, Device } from "./types";

const FULL = { view: true, edit: true, money: true, publish: true };
export const ADMINS: Record<AdminId, Admin> = {
  kim: { id: "kim", name: "김자연", title: "대표이사", email: "kim@greennarae.example", color: "#2F8F57", initial: "김", roles: ["디자인", "견적", "고객 소통", "행정"], permissions: FULL },
  choi: { id: "choi", name: "최관웅", title: "대표", email: "choi@greennarae.example", color: "#3D5A80", initial: "최", roles: ["실측", "시공", "납품"], permissions: FULL },
};
export const ADMIN_IDS: AdminId[] = ["kim", "choi"];

export const TASK_CATEGORY_ORDER: TaskCategory[] = ["design", "meeting", "owner", "estimate", "waiting", "admin"];
export const STAGE_ORDER: StageKey[] = ["measure", "quote", "design", "install", "settle"];

export const PRIORITY_LABEL: Record<Priority, string> = { urgent: "긴급", high: "높음", normal: "보통", low: "낮음" };
export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "예정", in_progress: "진행 중", review: "확인 대기", done: "완료" };
export const SOURCE_LABEL: Record<InquirySource, string> = { web: "홈페이지", phone: "전화", kakao: "카카오톡", visit: "방문", email: "이메일", etc: "기타" };
export const REPLY_CHANNEL_LABEL: Record<ReplyChannel, string> = { phone: "전화", sms: "문자", email: "이메일", kakao: "카카오톡", etc: "기타" };
export const INQUIRY_STATUS_LABEL = { open: "미답변", answered: "답변완료", closed: "종료" } as const;
export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = { draft: "견적작성", sent: "견적발송", signed: "계약완료", cancelled: "취소" };
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = { requested: "의뢰", producing: "제작중", shipped: "출고", received: "수령완료" };
export const ORDER_STATUS_ORDER: OrderStatus[] = ["requested", "producing", "shipped", "received"];
export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = { deposit: "계약금", balance: "잔금", extra: "추가" };
export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = { news: "소식", notice: "공지", event: "이벤트" };
export const VISIT_SOURCE_LABEL: Record<VisitSource, string> = { naver: "네이버 검색", naver_blog: "네이버 블로그·플레이스", google: "구글", daum: "다음·카카오", instagram: "인스타그램", direct: "직접 방문", other: "기타 사이트" };
export const DEVICE_LABEL: Record<Device, string> = { mobile: "모바일", tablet: "태블릿", desktop: "PC" };

export const DEFAULT_SETTINGS: Settings = {
  taskCategories: [
    { key: "design", label: "디자인", description: "시안 제작·수정·출력 데이터", defaultAssigneeId: "kim" },
    { key: "meeting", label: "실측미팅", description: "현장 실측·상담·미팅", defaultAssigneeId: "choi" },
    { key: "owner", label: "시공 및 납품", description: "시공·출고·납품", defaultAssigneeId: "choi" },
    { key: "estimate", label: "견적", description: "견적 작성·검토·발송", defaultAssigneeId: "kim" },
    { key: "waiting", label: "대기", description: "고객 회신·일정 확정 대기", defaultAssigneeId: null },
    { key: "admin", label: "기타 행정", description: "고객 소통·서류·정산", defaultAssigneeId: "kim" },
  ],
  stages: [
    { key: "measure", label: "상담·실측", color: "#E9A23B", defaultAssigneeId: "choi" },
    { key: "quote", label: "견적", color: "#C9A227", defaultAssigneeId: "kim" },
    { key: "design", label: "디자인", color: "#5B8DEF", defaultAssigneeId: "kim" },
    { key: "install", label: "시공·납품", color: "#2F8F57", defaultAssigneeId: "choi" },
    { key: "settle", label: "정산·완료", color: "#7A867F", defaultAssigneeId: "kim" },
  ],
  waitingReasons: ["고객 회신", "시안 확정", "입금", "자재 입고"],
  signTypes: ["채널간판", "돌출간판", "실내사인", "어닝·실사", "LED·네온"],
  purchaseCategories: ["자재비", "외주제작", "장비·차량", "운반", "기타"],
  vendorFields: ["채널", "LED", "실사출력", "철골·구조물", "기타"],
  notifications: { dailySummary: { enabled: true, time: "09:30", recipients: ["kim", "choi"], items: ["today", "overdue", "inquiries", "payments"] }, newInquiry: true },
  excludedVisitorIds: [],
};

export function categoryLabel(s: Settings, key: TaskCategory) { return s.taskCategories.find(c => c.key === key)?.label ?? key; }
export function stageLabel(s: Settings, key: StageKey) { return s.stages.find(c => c.key === key)?.label ?? key; }
export function stageColor(s: Settings, key: StageKey) { return s.stages.find(c => c.key === key)?.color ?? "#999"; }
