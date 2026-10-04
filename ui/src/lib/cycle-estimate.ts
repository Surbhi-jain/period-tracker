import { addDays, daysBetween, startToStartDays } from "./dates";

export type PeriodEntry = {
  id: string;
  startDate: string;
  endDate: string;
};

export const DEFAULT_CYCLE_LENGTH = 28;
export const LUTEAL_PHASE_DAYS = 14;
export const FERTILE_WINDOW_DAYS = 6;
export const PMS_DAYS = 5;

export type CycleEstimate = {
  hasPeriod: boolean;
  cycleDay: number | null;
  averageCycleLength: number;
  averagePeriodDuration: number | null;
  measuredCycles: number;
  estimatedNextStart: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  daysUntil: number | null;
  shiftDays: number | null;
  ovulationDate: string | null;
  fertileStart: string | null;
  fertileEnd: string | null;
  daysUntilOvulation: number | null;
  isFertileToday: boolean;
  isOvulationToday: boolean;
  pmsStart: string | null;
  pmsEnd: string | null;
  isPmsToday: boolean;
  isLate: boolean;
  isOnPeriod: boolean;
  isInWindow: boolean;
  confidence: "low" | "medium" | "high";
  explanation: string;
};

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

export function estimateCycle(
  entries: PeriodEntry[],
  today: string,
): CycleEstimate {
  const sorted = [...entries].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  if (sorted.length === 0) {
    return {
      hasPeriod: false,
      cycleDay: null,
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      averagePeriodDuration: null,
      measuredCycles: 0,
      estimatedNextStart: null,
      rangeStart: null,
      rangeEnd: null,
      daysUntil: null,
      shiftDays: null,
      ovulationDate: null,
      fertileStart: null,
      fertileEnd: null,
      daysUntilOvulation: null,
      isFertileToday: false,
      isOvulationToday: false,
      pmsStart: null,
      pmsEnd: null,
      isPmsToday: false,
      isLate: false,
      isOnPeriod: false,
      isInWindow: false,
      confidence: "low",
      explanation:
        "Log a period to see cycle day and an estimated next-period range.",
    };
  }

  const starts = sorted.map((entry) => entry.startDate);
  const lastStart = starts[starts.length - 1];
  const cycleLengths = starts
    .slice(1)
    .map((start, index) => startToStartDays(starts[index], start))
    .filter((length) => length >= 15 && length <= 60);

  const durations = sorted
    .map((entry) => daysBetween(entry.startDate, entry.endDate))
    .filter((duration) => duration >= 1 && duration <= 20);

  const measuredCycles = cycleLengths.length;
  const averageCycleLength = measuredCycles
    ? Math.round(average(cycleLengths))
    : DEFAULT_CYCLE_LENGTH;
  const averagePeriodDuration = durations.length
    ? Math.round(average(durations))
    : null;

  const spread =
    measuredCycles >= 2
      ? variation(cycleLengths)
      : measuredCycles === 1
        ? 3
        : 4;
  const pad = Math.min(6, Math.max(2, Math.round(spread || 3)));

  const estimatedNextStart = addDays(lastStart, averageCycleLength);
  const rangeStart = addDays(estimatedNextStart, -pad);
  const rangeEnd = addDays(estimatedNextStart, pad);
  const cycleDay = Math.max(1, startToStartDays(lastStart, today) + 1);
  const daysUntil = startToStartDays(today, estimatedNextStart);
  const lastEntry = sorted[sorted.length - 1];
  const isOnPeriod = today >= lastEntry.startDate && today <= lastEntry.endDate;
  const isInWindow = today >= rangeStart && today <= rangeEnd;
  const isLate = !isOnPeriod && today > rangeEnd;

  const ovulationDate = addDays(estimatedNextStart, -LUTEAL_PHASE_DAYS);
  const fertileStart = addDays(ovulationDate, -(FERTILE_WINDOW_DAYS - 1));
  const fertileEnd = ovulationDate;
  const daysUntilOvulation = startToStartDays(today, ovulationDate);
  const isFertileToday = today >= fertileStart && today <= fertileEnd;
  const isOvulationToday = today === ovulationDate;

  const pmsStart = addDays(estimatedNextStart, -PMS_DAYS);
  const pmsEnd = addDays(estimatedNextStart, -1);
  const isPmsToday = !isOnPeriod && today >= pmsStart && today <= pmsEnd;

  let confidence: CycleEstimate["confidence"] = "low";
  if (measuredCycles >= 3 && spread <= 3) confidence = "high";
  else if (measuredCycles >= 1 && spread <= 5) confidence = "medium";

  let explanation: string;
  if (measuredCycles === 0) {
    explanation = `Next period is estimated by adding a typical ${DEFAULT_CYCLE_LENGTH}-day cycle to your last start date. The range will tighten after you log at least two periods.`;
  } else if (measuredCycles === 1) {
    explanation = `Estimated from your 1 recorded cycle (${cycleLengths[0]} days from start to start).`;
  } else {
    explanation = `Estimated from the average of ${measuredCycles} recorded cycles (${averageCycleLength} days). The range reflects how much those cycles varied.`;
  }

  return {
    hasPeriod: true,
    cycleDay,
    averageCycleLength,
    averagePeriodDuration,
    measuredCycles,
    estimatedNextStart,
    rangeStart,
    rangeEnd,
    daysUntil,
    shiftDays: pad,
    ovulationDate,
    fertileStart,
    fertileEnd,
    daysUntilOvulation,
    isFertileToday,
    isOvulationToday,
    pmsStart,
    pmsEnd,
    isPmsToday,
    isLate,
    isOnPeriod,
    isInWindow,
    confidence,
    explanation,
  };
}