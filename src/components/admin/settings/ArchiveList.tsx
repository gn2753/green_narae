"use client";
import { useMemo } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { useRepo } from "@/data/DataProvider";
import { useAdmin, useCollection, useMutation } from "@/data/hooks";
import { reopenInquiry } from "@/services/inquiryService";
import { restoreProject } from "@/services/projectService";
import { formatDateKo } from "@/lib/format";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cardCls, ghostBtn } from "./settingsUi";

const day = (iso: string) => formatDateKo(iso.slice(0, 10));

export function ArchiveList() {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run, busy } = useMutation();
  const projects = useCollection("projects");
  const customers = useCollection("customers");
  const activities = useCollection("activities");
  const inquiries = useCollection("inquiries");

  const archived = useMemo(() => projects.items.filter(p => p.status !== "active").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [projects.items]);
  const closed = useMemo(() => inquiries.items.filter(q => q.status === "closed").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [inquiries.items]);
  const customerName = useMemo(() => new Map(customers.items.map(c => [c.id, c.name])), [customers.items]);
  const lastNote = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of [...activities.items].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) m.set(a.projectId, a.message);
    return m;
  }, [activities.items]);

  return (
    <>
      <section className={cardCls}>
        <h2 className="text-sm font-bold">완료·종료한 의뢰 {archived.length}건</h2>
        <p className="mb-3 text-sm text-[#56645C]">복원하면 의뢰 진행 화면으로 다시 돌아가요.</p>
        {archived.length === 0 ? <EmptyState icon={Archive} title="보관된 의뢰가 없어요" description="완료하거나 종료한 의뢰가 여기에 모여요." /> : (
          <ul className="divide-y divide-[#EEF1EF]">
            {archived.map(p => (
              <li key={p.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="flex flex-wrap items-center gap-1.5 font-bold">{p.title} <StatusBadge tone={p.status === "done" ? "green" : "gray"}>{p.status === "done" ? "완료" : "종료"}</StatusBadge></p>
                  <p className="text-sm text-[#56645C]">{customerName.get(p.customerId) ?? "고객 정보 없음"} · {p.signType} · 종료일 {day(p.updatedAt)}</p>
                  {lastNote.get(p.id) && <p className="truncate text-xs text-[#7A867F]">사유·기록: {lastNote.get(p.id)}</p>}
                </div>
                <button type="button" className={ghostBtn} disabled={busy || !admin} onClick={() => admin && run(() => restoreProject(repo, p.id, admin.id), `‘${p.title}’을(를) 복원했어요`)}><RotateCcw className="size-4" aria-hidden />복원</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="text-sm font-bold">종료한 문의 {closed.length}건</h2>
        <p className="mb-3 text-sm text-[#56645C]">다시 열면 문의·답변 화면의 미답변 목록으로 돌아가요.</p>
        {closed.length === 0 ? <EmptyState icon={Archive} title="종료한 문의가 없어요" description="스팸·불발로 종료한 문의가 여기에 모여요." /> : (
          <ul className="divide-y divide-[#EEF1EF]">
            {closed.map(q => (
              <li key={q.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-bold">{q.name} <span className="text-sm font-medium text-[#56645C]">{q.phone}</span></p>
                  <p className="line-clamp-2 text-sm text-[#3B4A41]">{q.message}</p>
                  <p className="text-xs text-[#7A867F]">종료일 {day(q.updatedAt)}</p>
                </div>
                <button type="button" className={ghostBtn} disabled={busy} onClick={() => run(() => reopenInquiry(repo, q.id), `${q.name} 문의를 다시 열었어요`)}><RotateCcw className="size-4" aria-hidden />다시 열기</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
