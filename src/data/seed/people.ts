import type { AdminId, Customer, Inquiry, InquirySource, Reply, ReplyChannel } from "@/domain/types";
import { base, pad, type SeedCtx } from "./util";

/** [상호, 대표 이름, 간판 종류, 현장 주소] — 샘플 값이며 실제 고객 정보가 아니다. */
export const CUSTOMER_TABLE: [company: string, name: string, signType: string, site: string][] = [
  ["온담카페", "박○○", "채널간판", "세종특별자치시 ○○로 00"],
  ["해봄수학", "김○○", "돌출간판", "대전광역시 ○○로 00"],
  ["밝은내과", "이○○", "실내사인", "세종특별자치시 ○○대로 00"],
  ["할매국수", "최○○", "어닝·실사", "공주시 ○○로 00"],
  ["BAR1984", "문○○", "LED·네온", "대전광역시 ○○길 00"],
  ["꽃길플라워", "강○○", "채널간판", "청주시 ○○로 00"],
  ["숲속키즈", "조○○", "실내사인", "세종특별자치시 ○○로 00"],
  ["24편의점", "윤○○", "돌출간판", "청주시 ○○로 00"],
  ["초록정육", "장○○", "어닝·실사", "공주시 ○○길 00"],
  ["불맛치킨", "임○○", "채널간판", "세종특별자치시 ○○로 00"],
  ["온기베이커리", "한○○", "채널간판", "대전광역시 ○○로 00"],
  ["모아안경", "오○○", "LED·네온", "세종특별자치시 ○○로 00"],
  ["세종○○약국", "서○○", "실내사인", "세종특별자치시 ○○로 00"],
  ["정○○미용실", "정○○", "채널간판", "세종특별자치시 ○○로 00"],
];
export const customerId = (n: number) => `c${pad(n)}`;
export const customerPhone = (n: number) => `010-0000-00${pad(n)}`;

const MEMOS: Record<number, string> = {
  1: "오전 10시 이후 통화 선호",
  5: "야간 영업 — 시공은 오전에만 가능",
  9: "주차 공간 협소, 고소작업차 진입 확인 필요",
  12: "잔금 일정 재확인 필요",
};

export function buildCustomers(ctx: SeedCtx): Customer[] {
  return CUSTOMER_TABLE.map(([company, name, , site], i) => {
    const n = i + 1;
    const created = ctx.at(-75 + n * 4, 10 + (n % 6), (n * 7) % 60);
    return {
      ...base(customerId(n), created),
      name, company, phone: customerPhone(n),
      ...(n % 2 === 1 ? { email: `demo${pad(n)}@example.com` } : {}),
      sites: [site],
      ...(MEMOS[n] ? { memo: MEMOS[n] } : {}),
    };
  });
}

type ReplySpec = [offset: number, hh: number, by: AdminId, channel: ReplyChannel, message: string];
interface InquirySpec {
  name: string; phone: string; email?: string; message: string; source: InquirySource;
  status: Inquiry["status"]; isNew: boolean; assigneeId: AdminId | null;
  customer?: number; projectId?: string; at: [offset: number, hh: number, mm: number]; replies?: ReplySpec[];
}

const INQUIRIES: InquirySpec[] = [
  { name: "한○○", phone: "010-0000-0021", email: "demo21@example.com", source: "web", status: "open", isNew: true, assigneeId: null, at: [0, 7, 52],
    message: "세종 나성동에 카페를 새로 여는데 채널간판이랑 돌출간판을 같이 견적 받고 싶어요. 가게 폭은 6m 정도입니다." },
  { name: "배○○", phone: "010-0000-0022", email: "demo22@example.com", source: "web", status: "open", isNew: true, assigneeId: null, at: [-1, 21, 30],
    message: "기존 간판 LED가 일부 나갔어요. 수리가 가능한지, 교체하면 비용이 얼마나 드는지 궁금합니다." },
  { name: "송○○", phone: "010-0000-0023", email: "demo23@example.com", source: "web", status: "open", isNew: false, assigneeId: "kim", at: [-2, 14, 10],
    message: "학원 실내 안내사인과 층별 안내판 제작 문의드립니다. 3개 층이고 디자인도 같이 부탁드리고 싶어요." },
  { name: "유○○", phone: "010-0000-0024", source: "phone", status: "open", isNew: false, assigneeId: "choi", at: [-3, 11, 0],
    message: "전화 문의: 미용실 어닝 교체 상담 원함. 오후에 다시 통화 요청하심." },
  { name: "박○○", phone: customerPhone(1), email: "demo01@example.com", source: "web", status: "answered", isNew: false, assigneeId: "kim", customer: 1, projectId: "p01", at: [-3, 9, 40],
    message: "카페 간판을 채널간판으로 바꾸고 싶어요. 지금은 플렉스 간판이고 가로 5m 정도입니다.",
    replies: [[-3, 13, "kim", "phone", "통화로 현장 실측 일정 안내 (최 대표 방문 예정)"]] },
  { name: "김○○", phone: customerPhone(2), source: "kakao", status: "answered", isNew: false, assigneeId: "choi", customer: 2, projectId: "p02", at: [-5, 16, 20],
    message: "학원 건물 2층이라 돌출간판이 필요해요. 건물주 허가는 받았습니다. 대략적인 비용 알려주세요.",
    replies: [[-5, 18, "kim", "kakao", "대략 금액대 안내, 실측 후 정확한 견적 드린다고 안내"], [-4, 10, "choi", "phone", "실측 방문 일정 확정"]] },
  { name: "이○○", phone: customerPhone(3), email: "demo03@example.com", source: "web", status: "answered", isNew: false, assigneeId: "kim", customer: 3, projectId: "p03", at: [-8, 10, 5],
    message: "병원 내부 접수처·진료실 안내사인을 새로 하려고 합니다. 깔끔한 느낌으로 부탁드려요.",
    replies: [[-8, 15, "kim", "email", "포트폴리오 참고 자료와 진행 순서 안내 메일 발송"]] },
  { name: "서○○", phone: customerPhone(13), source: "phone", status: "answered", isNew: false, assigneeId: "kim", customer: 13, at: [-12, 15, 30],
    message: "약국 유리창 시트와 실내 안내판 견적 요청. 사진을 문자로 보내주시기로 함.",
    replies: [[-12, 17, "kim", "sms", "사진 받고 견적 작성 예정이라고 문자 안내"]] },
  { name: "고○○", phone: "010-0000-0025", email: "demo25@example.com", source: "web", status: "answered", isNew: false, assigneeId: "kim", at: [-15, 20, 45],
    message: "간판 디자인만 따로 의뢰할 수 있나요? 시공은 건물 관리업체에서 한다고 합니다.",
    replies: [[-14, 10, "kim", "sms", "디자인 단독 의뢰 가능, 비용 범위 안내"], [-13, 11, "kim", "phone", "시안 2회 수정 포함 조건 설명"]] },
  { name: "남○○", phone: "010-0000-0026", source: "visit", status: "answered", isNew: false, assigneeId: "choi", at: [-18, 14, 0],
    message: "방문 상담: 식당 입구 어닝과 메뉴판 교체 문의. 다음 달 오픈 예정.",
    replies: [[-18, 16, "choi", "phone", "오픈 일정에 맞춰 시공 가능하다고 회신"]] },
  { name: "마케팅팀", phone: "010-0000-0027", email: "demo27@example.com", source: "web", status: "closed", isNew: false, assigneeId: null, at: [-20, 3, 12],
    message: "홈페이지 상위 노출 마케팅 상품을 소개드립니다. 지금 신청하시면 할인해 드려요." },
  { name: "전○○", phone: "010-0000-0028", source: "phone", status: "closed", isNew: false, assigneeId: "kim", at: [-25, 11, 30],
    message: "전화 문의: 상가 전체 간판 교체 견적 요청. 예산이 맞지 않아 보류하기로 함.",
    replies: [[-24, 10, "kim", "phone", "예산 조정이 어려워 다음에 다시 연락 주시기로 함"]] },
];

export function buildInquiries(ctx: SeedCtx): Inquiry[] {
  return INQUIRIES.map((q, i) => {
    const id = `q${pad(i + 1)}`;
    const created = ctx.at(...q.at);
    const replies: Reply[] = (q.replies ?? []).map(([off, hh, by, channel, message], j) => ({ id: `${id}-r${j + 1}`, at: ctx.at(off, hh, 0), by, channel, message }));
    const updated = replies.length ? replies[replies.length - 1].at : created;
    return {
      ...base(id, created, updated),
      name: q.name, phone: q.phone, ...(q.email ? { email: q.email } : {}), message: q.message, source: q.source,
      status: q.status, isNew: q.isNew, assigneeId: q.assigneeId,
      customerId: q.customer ? customerId(q.customer) : null, projectId: q.projectId ?? null, replies,
    };
  });
}
