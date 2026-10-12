"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAdmin, useMutation, useRepo } from "@/data/hooks";
import { ADMINS, ADMIN_IDS, PRIORITY_LABEL } from "@/domain/defaults";
import type { AdminId, ISODate, Task } from "@/domain/types";
import type { TaskInput } from "@/domain/tasks";
import { saveTask } from "@/services/taskService";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { cn } from "@/lib/utils";

const toInput = (t: Task): TaskInput => ({ title: t.title, category: t.category, assignee: t.assignee, assigneeId: t.assigneeId, priority: t.priority, workDate: t.workDate, dueDate: t.dueDate, status: t.status, projectId: t.projectId, customerId: t.customerId });

/** 오늘 일정 미완료 업무를 담당자별 2열로. 체크하면 완료 처리(디자인은 시공 및 납품으로 인계). */
export function TodayByAdmin({ tasks, today }: { tasks: Task[]; today: ISODate }) {
  const repo = useRepo();
  const { admin } = useAdmin();
  const { run } = useMutation();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const complete = async (t: Task) => {
    if (!admin || pending.has(t.id)) return;
    setPending(s => new Set(s).add(t.id));
    const saved = await run(() => saveTask(repo, { ...toInput(t), status: "done" }, t, admin.id));
    if (saved) {
      if (t.category === "design" && saved.category === "owner") toast.success(`디자인 완료 → 시공 및 납품(${saved.assignee})으로 넘겼어요`);
      else toast.success("업무를 완료했어요");
    }
    setPending(s => { const n = new Set(s); n.delete(t.id); return n; });
  };

  // 관리자 외 담당(외부·미지정) 업무도 상단 '오늘 할 일' 건수에 포함되므로 별도 묶음으로 보여 준다.
  const unassigned = tasks.filter(t => !t.assigneeId || !ADMIN_IDS.includes(t.assigneeId));
  const groups: { id: AdminId | null; list: Task[] }[] = [
    ...ADMIN_IDS.map(id => ({ id, list: tasks.filter(t => t.assigneeId === id) })),
    ...(unassigned.length ? [{ id: null, list: unassigned }] : []),
  ];

  return (
    <section aria-labelledby="today-by-admin" className="mb-4 md:mb-6">
      <h2 id="today-by-admin" className="sr-only">담당자별 오늘 일정</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groups.map(({ id, list }) => {
          return (
            <div key={id ?? "unassigned"} className={cn("rounded-xl border border-[#E3E8E4] bg-white p-3.5", !id && "md:col-span-2")}>
              <div className="mb-2 flex items-center gap-2">
                {id ? <AdminAvatar id={id} size="sm" /> : <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-[#EEF1EF] text-xs font-bold text-[#7A867F]">?</span>}
                <h3 className="text-sm font-bold text-[#1F2A24]">{id ? `${ADMINS[id].title} ${ADMINS[id].name}` : "기타·미배정"} · {list.length}</h3>
              </div>
              {list.length === 0 ? (
                <p className="flex items-center gap-1.5 py-3 text-sm text-[#7A867F]"><CheckCircle2 className="size-4 text-[#2F8F57]" aria-hidden />오늘 남은 일정이 없어요</p>
              ) : (
                <ul className="divide-y divide-[#EEF1EF]">
                  {list.map(t => {
                    const late = t.dueDate < today;
                    return (
                      <li key={t.id} className="flex items-center gap-2 py-1">
                        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9">
                          <Checkbox checked={false} disabled={pending.has(t.id)} onCheckedChange={() => complete(t)} aria-label={`${t.title} 완료`} />
                        </label>
                        <Link href={`/admin/tasks?id=${t.id}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 md:min-h-9">
                          <span className={cn("min-w-0 flex-1 truncate text-sm text-[#1F2A24]", pending.has(t.id) && "opacity-50")}>{t.title}</span>
                          {!t.assigneeId && t.assignee && t.assignee !== "미지정" && <span className="shrink-0 text-xs text-[#5F6B64]">{t.assignee}</span>}
                          {t.priority === "urgent" && <StatusBadge tone="red">{PRIORITY_LABEL.urgent}</StatusBadge>}
                          {late && <StatusBadge tone="red">지연</StatusBadge>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
