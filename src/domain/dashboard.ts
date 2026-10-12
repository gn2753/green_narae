import type { ISODate } from "./types";
import { addDays } from "./dates";
import { calendarEvents, EVENT_COLOR, type CalendarEventKind, type CalendarInput } from "./calendar";

export type WeekEventKind = CalendarEventKind;
export interface WeekEvent { kind: WeekEventKind; label: string; href: string; color: string }
export interface WeekDay { date: ISODate; items: WeekEvent[] }

export const WEEK_EVENT_COLOR = EVENT_COLOR;

/** weekStart부터 7일의 일정. 이벤트 수집은 calendarEvents와 공유한다. */
export function weekEvents(input: CalendarInput, weekStart: ISODate): WeekDay[] {
  const events = calendarEvents(input, weekStart, addDays(weekStart, 6));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, items: events.filter(e => e.date === date).map(({ kind, label, href, color }) => ({ kind, label, href, color })) };
  });
}
