import { estimateCycle, type PeriodEntry } from "@/lib/cycle-estimate";
import { formatDate } from "@/lib/dates";

const CONFIDENCE_LABEL = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "Higher confidence",
};

function timingLabel(estimate: ReturnType<typeof estimateCycle>) {
  if (estimate.isOnPeriod) return "Period in progress";
  if (estimate.isLate) return "May be late";
  if (estimate.isInWindow) return "Expected around now";
  if (estimate.daysUntil === 0) return "Around today";
  return `${estimate.daysUntil} days`;
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
          <p
            className={`confidence ${estimate.confidence}`}
            role="status"
          >
            {CONFIDENCE_LABEL[estimate.confidence]}
          </p>

          <div className="estimate-stats">
            <div className="estimate-stat">
              <span>{estimate.isOnPeriod ? "Period day" : "Cycle day"}</span>
              <strong>{estimate.cycleDay}</strong>
            </div>
            <div className="estimate-stat">
              <span>
                {estimate.isOnPeriod
                  ? "Status"
                  : estimate.isLate
                    ? "Timing"
                    : estimate.isInWindow
                      ? "Timing"
                      : "Days until estimate"}
              </span>
              <strong>{timingLabel(estimate)}</strong>
            </div>
            <div className="estimate-stat estimate-range">
              <span>Expected period range</span>
              <strong>
                {estimate.rangeStart && estimate.rangeEnd
                  ? `${formatDate(estimate.rangeStart)} – ${formatDate(estimate.rangeEnd)}`
                  : "—"}
              </strong>
            </div>
            <div className="estimate-stat">
              <span>Average cycle</span>
              <strong>{estimate.averageCycleLength} days</strong>
            </div>
            <div className="estimate-stat">
              <span>Average period</span>
              <strong>
                {estimate.averagePeriodDuration
                  ? `${estimate.averagePeriodDuration} days`
                  : "—"}
              </strong>
            </div>
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