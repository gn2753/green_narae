"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection, useSettings, useToday } from "@/data/hooks";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { addMonths, calendarEvents, monthGrid } from "@/domain/calendar";
import { addDays, startOfWeek } from "@/domain/dates";
import { activePayments } from "@/domain/money";
import { taskSummaries } from "@/domain/tasks";
import { CalendarToolbar, type AdminFilter, type CalendarView } from "./CalendarToolbar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { NotificationSettings } from "./NotificationSettings";
import { GoogleCalendarCard } from "./GoogleCalendarCard";

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

export function CalendarPage() {
  const tab = useSearchParams().get("tab") === "notifications" ? "notifications" : "calendar";
  const today = useToday();
  const settings = useSettings();
  const tasks = useCollection("tasks"), projects = useCollection("projects"), rawPayments = useCollection("payments"), contracts = useCollection("contracts");
  const customers = useCollection("customers"), inquiries = useCollection("inquiries");
  const loading = !settings || [tasks, projects, rawPayments, contracts, customers, inquiries].some(c => c.loading);

  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState<string | null>(null); // 보고 있는 기준일 (null = 오늘)
  const [admin, setAdmin] = useState<AdminFilter>("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const base = anchor ?? today;
  const month = base.slice(0, 7);
  const weekStart = startOfWeek(base);
  const selected = selectedDay && selectedDay.startsWith(month) ? selectedDay : today.startsWith(month) ? today : `${month}-01`;

  const grid = monthGrid(month);
  const from = view === "month" ? grid[0] : weekStart;
  const to = view === "month" ? grid[41] : addDays(weekStart, 6);
  const payments = { items: activePayments(rawPayments.items, contracts.items) };
  const events = calendarEvents({ tasks: tasks.items, projects: projects.items, payments: payments.items, customers: customers.items }, from, to)
    .filter(e => admin === "all" || e.adminId === admin);

  const tabs = [
    { label: "달력", href: "/admin/calendar", active: tab === "calendar" },
    { label: "알림 설정", href: "/admin/calendar?tab=notifications", active: tab === "notifications" },
  ];
  const label = view === "month" ? `${month.slice(0, 4)}년 ${Number(month.slice(5))}월` : `${md(weekStart)} ~ ${md(addDays(weekStart, 6))}`;
  // 이전·다음 달 칸을 누르면 그 달로 넘어가며 그날을 선택한다(모바일 점 보기에서 반응 없음 방지).
  const selectDay = (d: string) => { if (!d.startsWith(month)) setAnchor(`${d.slice(0, 7)}-01`); setSelectedDay(d); };
  const move = (dir: -1 | 1) => {
    if (view === "month") { setAnchor(`${addMonths(month, dir)}-01`); setSelectedDay(null); } else setAnchor(addDays(weekStart, 7 * dir));
  };

  let body;
  if (loading) body = <div className="h-64 animate-pulse rounded-xl bg-[#EEF1EF]" aria-busy />;
  else if (tab === "notifications") {
    const ts = taskSummaries(tasks.items, today);
    const weekEnd = addDays(startOfWeek(today), 6);
    const counts = {
      today: ts.today, overdue: ts.overdue,
      inquiries: inquiries.items.filter(q => q.status === "open").length,
      payments: payments.items.filter(p => !p.paidOn && p.dueDate >= today && p.dueDate <= weekEnd).length,
    };
    body = (<div className="space-y-4"><NotificationSettings settings={settings} counts={counts} /><GoogleCalendarCard /></div>);
  } else {
    body = (
      <>
        <CalendarToolbar label={label} view={view} onView={setView} onPrev={() => move(-1)} onNext={() => move(1)} onToday={() => { setAnchor(null); setSelectedDay(null); }} admin={admin} onAdmin={setAdmin} />
        {view === "month"
          ? <MonthView month={month} events={events} today={today} selected={selected} onSelect={selectDay} />
          : <WeekView weekStart={weekStart} events={events} today={today} />}
      </>
    );
  }
  return (<><PageHeader title="달력·알림" description="업무·실측·시공·입금 예정을 한눈에 보고, 알림을 설정해요" tabs={tabs} />{body}</>);
}
