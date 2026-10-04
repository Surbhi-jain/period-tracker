import {
  estimateCycle,
  FERTILE_WINDOW_DAYS,
  LUTEAL_PHASE_DAYS,
  PMS_DAYS,
  type PeriodEntry,
} from "./cycle-estimate";
import { addDays, formatShortRange, toUtcDate } from "./dates";

export type FlowLevel = "light" | "medium" | "heavy";

export const DEFAULT_PERIOD_LENGTH = 5;
export const PROJECTED_CYCLES = 6;

export type CalendarDay = {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  flow: FlowLevel | null;
  isPredictedPeriod: boolean;
  isPredictedStart: boolean;
  mayShift: boolean;
  shiftDays: number | null;
  isFertile: boolean;
  isOvulation: boolean;
  isPms: boolean;
};

export type CalendarMonth = {
  year: number;
  month: number;
  label: string;
  weeks: CalendarDay[][];
  highlights: MonthHighlight[];
};

export type MonthHighlight = {
  kind: "period" | "predicted" | "fertile" | "ovulation" | "pms";
  start: string;
  end: string;
  shiftDays: number | null;
  label: string;
};

type ProjectedCycle = {
  start: string;
  periodEnd: string;
  rangeStart: string;
  rangeEnd: string;
  ovulation: string;
  fertileStart: string;
  pmsStart: string;
  pmsEnd: string;
  shiftDays: number;
};

function within(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function periodOnDate(entries: PeriodEntry[], date: string) {
  return entries.find((entry) => within(date, entry.startDate, entry.endDate)) ?? null;
}

export function monthStart(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function projectCycles(
  entries: PeriodEntry[],
  today: string,
  count = PROJECTED_CYCLES,
): ProjectedCycle[] {
  const estimate = estimateCycle(entries, today);
  if (!estimate.estimatedNextStart || estimate.shiftDays === null) return [];

  const periodLength = estimate.averagePeriodDuration ?? DEFAULT_PERIOD_LENGTH;
  const cycles: ProjectedCycle[] = [];

  for (let index = 0; index < count; index += 1) {
    const start = addDays(
      estimate.estimatedNextStart,
      index * estimate.averageCycleLength,
    );
    const ovulation = addDays(start, -LUTEAL_PHASE_DAYS);
    cycles.push({
      start,
      periodEnd: addDays(start, periodLength - 1),
      rangeStart: addDays(start, -estimate.shiftDays),
      rangeEnd: addDays(start, estimate.shiftDays),
      ovulation,
      fertileStart: addDays(ovulation, -(FERTILE_WINDOW_DAYS - 1)),
      pmsStart: addDays(start, -PMS_DAYS),
      pmsEnd: addDays(start, -1),
      shiftDays: estimate.shiftDays,
    });
  }

  return cycles;
}

export function buildCalendarMonth(
  year: number,
  month: number,
  entries: PeriodEntry[],
  today: string,
  flowByDate: Record<string, FlowLevel> = {},
): CalendarMonth {
  const first = toUtcDate(monthStart(year, month));
  const gridStart = addDays(monthStart(year, month), -first.getUTCDay());
  const cycles = projectCycles(entries, today);
  const loggedDays = (date: string) =>
    entries.some((entry) => within(date, entry.startDate, entry.endDate));

  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = addDays(gridStart, week * 7 + weekday);
      const parsed = toUtcDate(date);
      const isLogged = loggedDays(date);
      const predicted = (test: (cycle: ProjectedCycle) => boolean) =>
        !isLogged && cycles.some(test);
      const shiftCycle = isLogged
        ? undefined
        : cycles.find((cycle) => within(date, cycle.rangeStart, cycle.rangeEnd));

      days.push({
        date,
        dayOfMonth: parsed.getUTCDate(),
        inMonth: parsed.getUTCMonth() === month,
        isToday: date === today,
        flow: isLogged ? (flowByDate[date] ?? "medium") : null,
        isPredictedPeriod: predicted((cycle) =>
          within(date, cycle.start, cycle.periodEnd),
        ),
        isPredictedStart: predicted((cycle) => cycle.start === date),
        mayShift: Boolean(shiftCycle),
        shiftDays: shiftCycle?.shiftDays ?? null,
        isFertile: predicted((cycle) =>
          within(date, cycle.fertileStart, cycle.ovulation),
        ),
        isOvulation: predicted((cycle) => cycle.ovulation === date),
        isPms: predicted((cycle) => within(date, cycle.pmsStart, cycle.pmsEnd)),
      });
    }
    weeks.push(days);
  }

  while (weeks.length > 4 && weeks[weeks.length - 1].every((day) => !day.inMonth)) {
    weeks.pop();
  }

  const label = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  return { year, month, label, weeks, highlights: summarizeMonth(weeks) };
}

function collectRanges(days: CalendarDay[], matches: (day: CalendarDay) => boolean) {
  const ranges: { start: string; end: string }[] = [];
  for (const day of days) {
    if (!day.inMonth || !matches(day)) continue;
    const last = ranges[ranges.length - 1];
    if (last && addDays(last.end, 1) === day.date) last.end = day.date;
    else ranges.push({ start: day.date, end: day.date });
  }
  return ranges;
}

const HIGHLIGHT_LABEL: Record<MonthHighlight["kind"], string> = {
  period: "Logged",
  predicted: "Period around",
  fertile: "Fertile",
  ovulation: "Ovulation",
  pms: "PMS",
};

export function summarizeMonth(weeks: CalendarDay[][]): MonthHighlight[] {
  const days = weeks.flat();
  const kinds: MonthHighlight["kind"][] = [
    "period",
    "fertile",
    "ovulation",
    "pms",
    "predicted",
  ];
  const matches: Record<MonthHighlight["kind"], (day: CalendarDay) => boolean> = {
    period: (day) => Boolean(day.flow),
    predicted: (day) => day.isPredictedPeriod,
    fertile: (day) => day.isFertile,
    ovulation: (day) => day.isOvulation,
    pms: (day) => day.isPms,
  };

  const highlights: MonthHighlight[] = [];
  for (const kind of kinds) {
    for (const range of collectRanges(days, matches[kind])) {
      const startDay = days.find((day) => day.date === range.start);
      const shiftDays = kind === "predicted" ? (startDay?.shiftDays ?? null) : null;
      const when =
        kind === "predicted" && shiftDays !== null
          ? `${formatShortRange(range.start, range.start)} ±${shiftDays}`
          : formatShortRange(range.start, range.end);
      highlights.push({
        kind,
        ...range,
        shiftDays,
        label: `${HIGHLIGHT_LABEL[kind]} ${when}`,
      });
    }
  }
  return highlights;
}
