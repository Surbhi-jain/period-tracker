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