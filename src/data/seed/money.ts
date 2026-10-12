import type { Contract, LedgerEntry, OrderStatus, Payment, PurchaseOrder, Settings, Vendor } from "@/domain/types";
import { ledgerDraftFromOrder, ledgerDraftFromPayment, paymentsForSignedContract } from "@/domain/money";
import { CUSTOMER_TABLE, customerId } from "./people";
import { projectCustomer, projectId } from "./work";
import { base, int, pad, pick, type SeedCtx } from "./util";

interface ContractSpec {
  project?: number; customer?: number; status: Contract["status"]; quote: number; sentOn?: number; signedOn?: number;
  /** signed: [계약금 납기, 계약금 입금일|null], [잔금 납기, 잔금 입금일|null] */
  deposit?: [due: number, paid: number | null]; balance?: [due: number, paid: number | null]; memo?: string;
}
/** 계약 9: 견적작성 2 · 견적발송 2 · 계약완료 5 */
const CONTRACTS: ContractSpec[] = [
  { project: 3, status: "draft", quote: 2_400_000, memo: "실측 결과 반영해 수량 확정 예정" },
  { customer: 13, status: "draft", quote: 1_800_000 },
  { project: 4, status: "sent", quote: 3_200_000, sentOn: -6 },
  { project: 5, status: "sent", quote: 2_900_000, sentOn: -2 },
  { project: 7, status: "signed", quote: 3_000_000, sentOn: -22, signedOn: -20, deposit: [-20, -20], balance: [15, null] },
  { project: 9, status: "signed", quote: 4_000_000, sentOn: -26, signedOn: -25, deposit: [-25, -25], balance: [3, null] },
  { project: 10, status: "signed", quote: 5_000_000, sentOn: -19, signedOn: -18, deposit: [-18, -18], balance: [5, null] },
  { project: 11, status: "signed", quote: 4_200_000, sentOn: -41, signedOn: -40, deposit: [-40, -40], balance: [-5, -5] },
  { project: 12, status: "signed", quote: 3_600_000, sentOn: -51, signedOn: -50, deposit: [-50, -50], balance: [-6, null], memo: "잔금 지연 — 안내 문자 예정" },
];
/** 추가 입금 6건: [계약 번호, 금액, 납기, 입금일|null] → 미수는 k09 잔금 + 아래 k09 추가분 = 정확히 2건 */
const EXTRAS: [contract: number, amount: number, due: number, paid: number | null][] = [
  [8, 330_000, -4, -4], [9, 220_000, -3, null], [6, 440_000, -10, -10], [5, 275_000, 20, null], [7, 385_000, -12, -12], [8, 165_000, -2, -2],
];

export function buildContractsAndPayments(ctx: SeedCtx): { contracts: Contract[]; payments: Payment[] } {
  const contracts: Contract[] = []; const payments: Payment[] = [];
  let p = 0;
  CONTRACTS.forEach((s, i) => {
    const id = `k${pad(i + 1)}`;
    const cust = s.project ? projectCustomer(s.project) : s.customer!;
    const created = ctx.at(s.sentOn !== undefined ? s.sentOn - 1 : -3, 14, 0);
    const updated = ctx.at(s.signedOn ?? s.sentOn ?? -3, 16, 0);
    const amount = Math.round(s.quote * 1.1);
    const half = Math.round(amount / 2 / 10_000) * 10_000;
    const k: Contract = {
      ...base(id, created, updated),
      customerId: customerId(cust), projectId: s.project ? projectId(s.project) : null, status: s.status,
      quoteAmount: s.quote, vatIncluded: true,
      ...(s.sentOn !== undefined ? { quoteSentOn: ctx.day(s.sentOn) } : {}),
      ...(s.status === "signed" ? {
        contractAmount: amount, signedOn: ctx.day(s.signedOn!),
        deposit: { amount: half, dueDate: ctx.day(s.deposit![0]) }, balance: { amount: amount - half, dueDate: ctx.day(s.balance![0]) },
      } : {}),
      ...(s.memo ? { memo: s.memo } : {}),
    };
    contracts.push(k);
    if (s.status === "signed") {
      const paid = [s.deposit![1], s.balance![1]];
      paymentsForSignedContract(k).forEach((draft, j) => {
        const paidOff = paid[j];
        payments.push({ ...base(`pay${pad(++p)}`, ctx.at(s.signedOn!, 16, 10), paidOff !== null ? ctx.at(paidOff, 15, 0) : ctx.at(s.signedOn!, 16, 10)), ...draft, paidOn: paidOff !== null ? ctx.day(paidOff) : null, ...(paidOff !== null ? { confirmedBy: "kim" as const } : {}) });
      });
    }
  });
  EXTRAS.forEach(([kn, amount, due, paid]) => {
    const k = contracts[kn - 1];
    payments.push({
      ...base(`pay${pad(++p)}`, ctx.at(due - 7, 11, 0), paid !== null ? ctx.at(paid, 15, 30) : ctx.at(due - 7, 11, 0)),
      contractId: k.id, customerId: k.customerId, projectId: k.projectId, kind: "extra", amount, dueDate: ctx.day(due),
      paidOn: paid !== null ? ctx.day(paid) : null, ...(paid !== null ? { confirmedBy: "kim" as const } : {}),
    });
  });
  return { contracts, payments };
}

const VENDORS: [name: string, field: string, contact: string, memo?: string][] = [
  ["한빛채널", "채널", "이○○", "채널 글자 주력, 납기 5~7일"],
  ["세종채널공방", "채널", "박○○"],
  ["밝음LED", "LED", "김○○", "LED 모듈·SMPS"],
  ["대전실사출력", "실사출력", "최○○", "당일 출력 가능"],
  ["튼튼철골", "철골·구조물", "정○○"],
  ["충청고소작업", "기타", "윤○○", "고소작업차 임대(반일/종일)"],
];
export function buildVendors(ctx: SeedCtx): Vendor[] {
  return VENDORS.map(([name, field, contactName, memo], i) => ({
    ...base(`v${pad(i + 1)}`, ctx.at(-200 + i * 9, 10, 0)), name, field, contactName, phone: `010-0000-01${pad(i + 1)}`, ...(memo ? { memo } : {}),
  }));
}

/** 발주 10: 의뢰 2 · 제작중 3 · 출고 2 · 수령완료 3 */
const ORDERS: [project: number | null, vendor: number, item: string, amount: number, ordered: number, due: number, status: OrderStatus][] = [
  [6, 1, "채널 글자 제작 (꽃길플라워)", 1_320_000, -3, 4, "requested"],
  [8, 4, "돌출간판 실사 출력", 286_000, -1, 3, "requested"],
  [7, 4, "실내사인 아크릴 출력", 418_000, -5, 2, "producing"],
  [9, 5, "어닝 프레임 제작", 880_000, -8, 1, "producing"],
  [10, 2, "채널 글자 제작 (불맛치킨)", 1_540_000, -9, 2, "producing"],
  [10, 3, "LED 모듈·SMPS", 352_000, -6, -1, "shipped"],
  [null, 3, "LED 모듈 재고 보충", 495_000, -4, 1, "shipped"],
  [11, 1, "채널 글자 제작 (온기베이커리)", 1_210_000, -35, -28, "received"],
  [12, 3, "네온 LED 바 제작", 990_000, -45, -38, "received"],
  [11, 6, "고소작업차 임대", 330_000, -22, -20, "received"],
];
export function buildOrders(ctx: SeedCtx): PurchaseOrder[] {
  return ORDERS.map(([project, vendor, item, amount, ordered, due, status], i) => ({
    ...base(`o${pad(i + 1)}`, ctx.at(ordered, 11, 0), ctx.at(status === "received" ? due : ordered, 15, 0)),
    projectId: project ? projectId(project) : null, vendorId: `v${pad(vendor)}`, item, amount,
    orderedOn: ctx.day(ordered), dueDate: ctx.day(due), status, receivedOn: status === "received" ? ctx.day(due) : null,
  }));
}

/** 이번 달 포함 최근 6개월의 'YYYY-MM' (과거 → 현재) */
function recentMonths(today: string, n: number): string[] {
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7)) - 1;
  return Array.from({ length: n }, (_, i) => { const t = y * 12 + m - (n - 1 - i); return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`; });
}

const SALE_MEMOS = ["간판 제작·시공", "실내사인 제작", "현수막·실사 출력", "간판 보수", "LED 교체"];
/** 매입매출: 입금확인·수령완료 연결분 + 월 8~12건이 되도록 채운 일반 거래 */
export function buildLedger(ctx: SeedCtx, settings: Settings, payments: Payment[], orders: PurchaseOrder[]): LedgerEntry[] {
  const { rng, today } = ctx;
  const drafts: Omit<LedgerEntry, "id" | "createdAt" | "updatedAt" | "version">[] = [
    ...payments.filter(p => p.paidOn).map(ledgerDraftFromPayment),
    ...orders.filter(o => o.status === "received").map(o => ledgerDraftFromOrder(o, settings)),
  ];
  const purchaseCats = settings.purchaseCategories;
  for (const month of recentMonths(today, 6)) {
    const target = int(rng, 8, 12);
    const linked = drafts.filter(d => d.date.startsWith(month)).length;
    const lastDay = month === today.slice(0, 7) ? Number(today.slice(8, 10)) : 28;
    for (let k = linked; k < target; k++) {
      const date = `${month}-${pad(int(rng, 1, lastDay))}`;
      if (rng() < 0.42) {
        const gross = int(rng, 66, 396) * 10_000;
        const amount = Math.round(gross / 1.1);
        const cust = int(rng, 1, CUSTOMER_TABLE.length);
        drafts.push({ type: "sale", date, amount, vat: gross - amount, customerId: customerId(cust), projectId: null, memo: `${CUSTOMER_TABLE[cust - 1][0]} ${pick(rng, SALE_MEMOS)}` });
      } else {
        const gross = int(rng, 9, 132) * 10_000;
        const amount = Math.round(gross / 1.1);
        const category = pick(rng, purchaseCats);
        drafts.push({ type: "purchase", date, amount, vat: gross - amount, category, vendorId: `v${pad(int(rng, 1, 6))}`, projectId: null, memo: `${category} 지출` });
      }
    }
  }
  return drafts
    .map((d, i) => ({ d, i }))
    .sort((a, b) => a.d.date.localeCompare(b.d.date) || a.i - b.i)
    .map(({ d }, i) => { const at = new Date(`${d.date}T18:00:00+09:00`).toISOString(); return { ...base(`l${pad(i + 1, 3)}`, at), ...d }; });
}
