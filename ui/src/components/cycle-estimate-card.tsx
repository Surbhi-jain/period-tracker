"use client";

import {
  estimateCycle,
  FERTILE_WINDOW_DAYS,
  PMS_DAYS,
  type PeriodEntry,
} from "@/lib/cycle-estimate";
import { formatDate } from "@/lib/dates";
import { CycleRing } from "./tracker/cycle-pattern";

const CONFIDENCE_LABEL = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "Higher confidence",
};

export function timingLabel(estimate: ReturnType<typeof estimateCycle>) {
  if (estimate.isOnPeriod) return "Bleeding in progress";
  if (estimate.isLate) return "May be late";
  if (estimate.isInWindow) return "Expected around now";
  if (estimate.daysUntil === 0) return "Around today";
  return `${estimate.daysUntil} days`;
}

function countdown(days: number) {
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

export function fertileLabel(estimate: ReturnType<typeof estimateCycle>) {
  if (!estimate.fertileStart || estimate.daysUntilOvulation === null) return "";
  if (estimate.isFertileToday) return "You may be fertile today";
  if (estimate.daysUntilOvulation < 0) return "Passed for this cycle";
  const daysUntilStart = estimate.daysUntilOvulation - (FERTILE_WINDOW_DAYS - 1);
  return `Starts ${countdown(daysUntilStart)}`;
}

export function ovulationLabel(estimate: ReturnType<typeof estimateCycle>) {
  if (estimate.daysUntilOvulation === null) return "";
  if (estimate.isOvulationToday) return "Estimated for today";
  if (estimate.daysUntilOvulation < 0) return "Passed for this cycle";
  return countdown(estimate.daysUntilOvulation);
}

export function pmsLabel(estimate: ReturnType<typeof estimateCycle>) {
  if (!estimate.pmsStart || estimate.daysUntil === null) return "";
  if (estimate.isPmsToday) return "PMS symptoms may show up now";
  const daysUntilStart = estimate.daysUntil - PMS_DAYS;
  if (daysUntilStart < 0) return "Passed for this cycle";
  if (daysUntilStart === 0) return "Starts today";
  return `Starts ${countdown(daysUntilStart)}`;
}

export function CycleEstimateCard({
  entries,
  today,
}: {
  entries: PeriodEntry[];
  today: string;
}) {
  const estimate = estimateCycle(entries, today);

  return (
    <section className="card estimate-card" aria-labelledby="estimate-title">
      <div className="step-label">YOUR CYCLE</div>
      <h2 id="estimate-title">Next period estimate</h2>

      {!estimate.hasPeriod ? (
        <p className="card-copy">
          Log a period below to see cycle day and an estimated date range. Luna
          never treats this as a diagnosis.
        </p>
      ) : (
        <>
          <div className="estimate-hero">
            <CycleRing estimate={estimate} />
            <div>
              <p className={`confidence ${estimate.confidence}`} role="status">
                {CONFIDENCE_LABEL[estimate.confidence]}
              </p>
              {estimate.isOnPeriod || estimate.isLate || estimate.isInWindow || estimate.daysUntil === 0 ? (
                <p className="estimate-timing">{timingLabel(estimate)}</p>
              ) : null}
            </div>
          </div>

          <div className="estimate-stats">
            <div className="estimate-stat estimate-range">
              <span>Expected period range</span>
              <strong>
                {estimate.rangeStart && estimate.rangeEnd
                  ? `${formatDate(estimate.rangeStart)} – ${formatDate(estimate.rangeEnd)}`
                  : "—"}
              </strong>
            </div>
            <div className="estimate-stat">
              <span>Average period</span>
              <strong>
                {estimate.averagePeriodDuration
                  ? `${estimate.averagePeriodDuration} days`
                  : "—"}
              </strong>
            </div>
            {estimate.shiftDays ? (
              <div className="estimate-stat">
                <span>May shift</span>
                <strong>±{estimate.shiftDays} days</strong>
              </div>
            ) : null}
          </div>

          <p className="estimate-note">{estimate.explanation}</p>

          <p className="estimate-disclaimer">
            This is an estimate, not a medical diagnosis, and must not be used
            as contraception.
          </p>
        </>
      )}
    </section>
  );
}
