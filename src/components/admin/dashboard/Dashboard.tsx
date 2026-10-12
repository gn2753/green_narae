"use client";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";
import { useCollection, useSettings, useToday } from "@/data/hooks";
import { taskSummaries } from "@/domain/tasks";
import { activePayments, receivables } from "@/domain/money";
import { visitorSummary } from "@/domain/analytics";
import { weekEvents } from "@/domain/dashboard";
import { addDays, startOfWeek } from "@/domain/dates";
import { formatWon } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { cn } from "@/lib/utils";
import { SummaryCards } from "./SummaryCards";
import { TodayByAdmin } from "./TodayByAdmin";
import { PipelineBar } from "./PipelineBar";
import { WeekSchedule } from "./WeekSchedule";
import { RecentInquiries } from "./RecentInquiries";
import { UpcomingPayments } from "./UpcomingPayments";

const title = (today: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", month: "long", day: "numeric", weekday: "long" }).format(new Date(`${today}T12:00:00Z`));

export function Dashboard() {
  const today = useToday();
  const settings = useSettings();
  const tasks = useCollection("tasks"), projects = useCollection("projects"), payments = useCollection("payments"), contracts = useCollection("contracts");
  const inquiries = useCollection("inquiries"), customers = useCollection("customers"), visits = useCollection("visits");
  const loading = !settings || [tasks, projects, payments, contracts, inquiries, customers, visits].some(c => c.loading);

  const actions = (
    <>
      <Link href="/admin/print" className={cn(buttonVariants({ variant: "outline" }), "h-11 md:h-8")}><Printer className="size-4" aria-hidden />인쇄</Link>
      <Link href="/admin/tasks?new=1" className={cn(buttonVariants(), "h-11 md:h-8")}><Plus className="size-4" aria-hidden />업무 등록</Link>
    </>
  );
  if (loading) return (<><PageHeader title={title(today)} actions={actions} /><div className="h-64 animate-pulse rounded-xl bg-[#EEF1EF]" aria-busy /></>);

  const ts = taskSummaries(tasks.items, today);
  const livePayments = activePayments(payments.items, contracts.items);
  const rc = receivables(livePayments, today);
  const vs = visitorSummary(visits.items, today, settings.excludedVisitorIds);
  const openInq = inquiries.items.filter(q => q.status === "open").length;
  const weekStart = startOfWeek(today);
  const days = weekEvents({ tasks: tasks.items, projects: projects.items, payments: livePayments, customers: customers.items }, weekStart);
  const todayTasks = tasks.items.filter(t => t.workDate === today && t.status !== "done").sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <PageHeader title={title(today)} actions={actions} />
      <SummaryCards cards={[
        { key: "today", label: "오늘 할 일", value: `${ts.today}건`, href: "/admin/tasks?view=today" },
        { key: "overdue", label: "지연", value: `${ts.overdue}건`, tone: ts.overdue ? "red" : undefined, href: "/admin/tasks?view=overdue" },
        { key: "urgent", label: "긴급", value: `${ts.urgent}건`, href: "/admin/tasks?priority=urgent" },
        { key: "inq", label: "미답변 문의", value: `${openInq}건`, tone: openInq ? "coral" : undefined, href: "/admin/inquiries?status=open" },
        { key: "recv", label: "미수금", value: formatWon(rc.overdueAmount), sub: `${rc.overdueCount}건`, tone: rc.overdueCount ? "red" : undefined, href: "/admin/payments?status=overdue" },
        { key: "visit", label: "오늘 방문자", value: `${vs.today}명`, href: "/admin/stats" },
      ]} />
      <TodayByAdmin tasks={todayTasks} today={today} />
      <PipelineBar projects={projects.items} settings={settings} />
      <div className="mb-4 md:mb-6"><WeekSchedule days={days} today={today} /></div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <RecentInquiries inquiries={inquiries.items} />
        <UpcomingPayments payments={livePayments} customers={customers.items} today={today} weekEnd={addDays(weekStart, 6)} />
      </div>
    </>
  );
}
