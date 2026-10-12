import type { ISODate, Settings } from "@/domain/types";
import { DEFAULT_SETTINGS } from "@/domain/defaults";
import type { DemoSnapshot } from "../repository";
import { makeCtx } from "./util";
import { buildCustomers, buildInquiries } from "./people";
import { buildProjectsAndActivities, buildTasks } from "./work";
import { buildContractsAndPayments, buildLedger, buildOrders, buildVendors } from "./money";
import { buildNews, buildPortfolios } from "./content";
import { ADMIN_VISITOR_IDS, buildVisits } from "./visits";

/**
 * 데모 시드 데이터(spec §9). 실제 고객 정보가 아니다.
 * 같은 today → 항상 같은 결과(결정적 난수, 모든 날짜는 today 기준 상대값).
 */
export function buildSeed(today: ISODate): DemoSnapshot {
  const ctx = makeCtx(today);
  const settings: Settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  settings.excludedVisitorIds = [...new Set([...settings.excludedVisitorIds, ...ADMIN_VISITOR_IDS])];

  const customers = buildCustomers(ctx);
  const inquiries = buildInquiries(ctx);
  const { projects, activities } = buildProjectsAndActivities(ctx, settings);
  const tasks = buildTasks(ctx);
  const { contracts, payments } = buildContractsAndPayments(ctx);
  const vendors = buildVendors(ctx);
  const orders = buildOrders(ctx);
  const ledger = buildLedger(ctx, settings, payments, orders);
  const portfolios = buildPortfolios(ctx);
  const news = buildNews(ctx);
  const visits = buildVisits(ctx);

  return {
    schema: 1,
    settings,
    collections: { customers, inquiries, projects, activities, tasks, contracts, payments, vendors, orders, ledger, portfolios, news, visits },
  };
}
