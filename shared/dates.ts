export function toUtcDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayUtc() {
  return todayLocal();
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = toUtcDate(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function latestAllowedDate(now = new Date()) {
  // The server does not know the visitor's time zone; UTC+14 is the furthest ahead.
  return addDays(now.toISOString().slice(0, 10), 1);
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

export function formatWeekdayDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

export function formatShortRange(start: string, end: string) {
  const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "UTC" });
  const dayMonth = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  if (start === end) return dayMonth.format(toUtcDate(start));

  const from = toUtcDate(start);
  const to = toUtcDate(end);
  if (from.getUTCMonth() === to.getUTCMonth() && from.getUTCFullYear() === to.getUTCFullYear()) {
    return `${day.format(from)}–${dayMonth.format(to)}`;
  }
  return `${dayMonth.format(from)} – ${dayMonth.format(to)}`;
}

export function startToStartDays(start: string, end: string) {
  return Math.round(
    (toUtcDate(end).getTime() - toUtcDate(start).getTime()) / 86_400_000,
  );
}

export function daysBetween(start: string, end: string) {
  return startToStartDays(start, end) + 1;
}

export function addDays(isoDate: string, days: number) {
  const date = toUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}