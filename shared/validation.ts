import { daysBetween, isIsoDate, rangesOverlap } from "./dates";
import type { PeriodRecord } from "./tracker-types";

export const EARLIEST_DATE = "1900-01-01";
export const MAX_PERIOD_DAYS = 20;
export const MAX_PERIODS_PER_ACCOUNT = 1000;

export const PERIOD_ERROR = {
  missing: "Please select both the start day and end day of bleeding.",
  invalidDate: "Please choose real calendar dates.",
  endBeforeStart: "The end day of bleeding cannot be before the start day.",
  tooLong: `Please check the dates. A period entry cannot exceed ${MAX_PERIOD_DAYS} days.`,
  future: "Period dates cannot be in the future.",
  overlap:
    "This overlaps another saved period. Update or remove that entry first.",
} as const;

export type PeriodRange = {
  id?: string;
  startDate: string;
  endDate: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function validatePeriodInput(
  startDate: unknown,
  endDate: unknown,
  options?: { today?: string },
): string | null {
  if (!startDate || !endDate) return PERIOD_ERROR.missing;
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate < EARLIEST_DATE) {
    return PERIOD_ERROR.invalidDate;
  }
  if (endDate < startDate) return PERIOD_ERROR.endBeforeStart;
  if (options?.today && (startDate > options.today || endDate > options.today)) {
    return PERIOD_ERROR.future;
  }
  if (daysBetween(startDate, endDate) > MAX_PERIOD_DAYS) return PERIOD_ERROR.tooLong;
  return null;
}

export function periodOverlaps(
  startDate: string,
  endDate: string,
  existing: PeriodRange[],
  excludeId?: string | null,
): boolean {
  return existing.some(
    (entry) =>
      entry.id !== excludeId &&
      rangesOverlap(entry.startDate, entry.endDate, startDate, endDate),
  );
}

export function periodFromRow(row: {
  id: string;
  start_date: string;
  end_date: string;
}): PeriodRecord {
  return { id: row.id, startDate: row.start_date, endDate: row.end_date };
}
