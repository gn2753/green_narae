import { describe, it, expect } from "vitest";
import { buildSeed } from "@/data/seed";
import { toCsv } from "./csv";
import { exportSets, sortTasksForPrint } from "./exportSets";

const snap = buildSeed("2026-10-11");
const c = snap.collections;
const count = { tasks: c.tasks.length, customers: c.customers.length, contracts: c.contracts.length, ledger: c.ledger.length, payments: c.payments.length };

describe("exportSets", () => {
  it("세트별 행 수가 컬렉션과 같다", () => {
    for (const k of Object.keys(count) as (keyof typeof count)[]) expect(exportSets[k].rows(c, snap.settings)).toHaveLength(count[k]);
  });
  it("업무 컬럼 라벨", () => {
    expect(exportSets.tasks.columns.map(x => x.label)).toEqual(["번호", "업무파트", "업무명", "담당자", "우선순위", "일정일", "마감일", "상태"]);
  });
  it("CSV 첫 줄은 BOM + 라벨", () => {
    const csv = toCsv(exportSets.tasks.rows(c, snap.settings), exportSets.tasks.columns);
    expect(csv.split("\r\n")[0]).toBe("\uFEFF번호,업무파트,업무명,담당자,우선순위,일정일,마감일,상태");
  });
  it("금액은 숫자, 날짜는 YYYY-MM-DD, 담당자는 이름", () => {
    const pay = exportSets.payments.rows(c, snap.settings);
    expect(pay.every(r => typeof r.amount === "number")).toBe(true);
    expect(pay.every(r => /^\d{4}-\d{2}-\d{2}$/.test(String(r.dueDate)))).toBe(true);
    expect(pay.every(r => !/^(cust|c_)/.test(String(r.customer)))).toBe(true);
    const t = exportSets.tasks.rows(c, snap.settings);
    expect(t[0].category).toBe(snap.settings.taskCategories.find(x => x.key === c.tasks.find(y => y.title === t[0].title)!.category)!.label);
  });
  it("알 수 없는 관리자 id도 내보내기가 깨지지 않는다", () => {
    const bad = { ...c, tasks: [{ ...c.tasks[0], assigneeId: "zzz" as never, assignee: "외부" }], payments: [{ ...c.payments[0], confirmedBy: "zzz" as never }] };
    expect(exportSets.tasks.rows(bad, snap.settings)[0].assignee).toBe("외부");
    expect(exportSets.payments.rows(bad, snap.settings)[0].confirmedBy).toBe("");
  });
  it("취소 계약의 입금 항목은 취소 계약으로 표시", () => {
    const p = { ...c.payments.find(x => !x.paidOn)!, contractId: "k-cancel" };
    const k = { ...c.contracts[0], id: "k-cancel", status: "cancelled" as const };
    const rows = exportSets.payments.rows({ ...c, contracts: [...c.contracts, k], payments: [p] }, snap.settings);
    expect(rows[0].status).toBe("취소 계약");
  });
  it("인쇄 정렬: 파트 순서, 우선순위, 일정일", () => {
    const rows = sortTasksForPrint(c.tasks);
    const co = ["design", "meeting", "owner", "estimate", "waiting", "admin"], po = ["urgent", "high", "normal", "low"];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i];
      const ka = [co.indexOf(a.category), po.indexOf(a.priority), a.workDate], kb = [co.indexOf(b.category), po.indexOf(b.priority), b.workDate];
      expect(ka[0] < kb[0] || (ka[0] === kb[0] && (ka[1] < kb[1] || (ka[1] === kb[1] && ka[2] <= kb[2])))).toBe(true);
    }
  });
});
