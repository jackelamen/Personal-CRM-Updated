import type { Contact } from "./types";

const MS_PER_DAY = 86_400_000;

/** Parse a `YYYY-MM-DD` string at local noon, so timezone shifts never move the day. */
function parseDay(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

/** Local midnight for a date, so day comparisons are whole days apart. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function todayInputDate(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Whole days from today until `value`. Negative means overdue. */
export function daysUntil(value?: string): number | null {
  if (!value) return null;
  const parsed = parseDay(value);
  if (Number.isNaN(parsed.getTime())) return null;
  // Both sides are local midnight, so the difference is a whole number of days
  // (Math.round absorbs the hour gained or lost across a DST boundary).
  return Math.round((startOfDay(parsed) - startOfDay(new Date())) / MS_PER_DAY);
}

export function isDueSoon(value?: string, withinDays = 7): boolean {
  const days = daysUntil(value);
  return days !== null && days <= withinDays;
}

export function isOverdue(value?: string): boolean {
  const days = daysUntil(value);
  return days !== null && days < 0;
}

export function formatDate(value?: string): string {
  if (!value) return "";
  const date = parseDay(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Human phrasing for a follow-up date: "Today", "3 days ago", "in 2 weeks". */
export function formatRelativeDay(value?: string): string {
  const days = daysUntil(value);
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) {
    const overdue = Math.abs(days);
    if (overdue < 7) return `${overdue} days ago`;
    const weeks = Math.round(overdue / 7);
    return weeks === 1 ? "A week ago" : `${weeks} weeks ago`;
  }
  if (days < 7) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "in a week" : `in ${weeks} weeks`;
}

export function getInitials(contact: Pick<Contact, "name" | "firstName" | "lastName">): string {
  const fromParts = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (fromParts || contact.name.slice(0, 2)).toUpperCase();
}
