import type { CycleEstimate } from "@/lib/cycle-estimate";

const RING = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING;

export function ringProgress(estimate: CycleEstimate) {
  if (!estimate.cycleDay) return 0;
  return Math.min(1, estimate.cycleDay / estimate.averageCycleLength);
}

export function patternTitle(estimate: CycleEstimate) {
  if (estimate.isOnPeriod) return `Bleeding, day ${estimate.cycleDay}`;
  if (estimate.isLate) return "Past the usual length";
  return `Day ${estimate.cycleDay}`;
}

export function patternNote(estimate: CycleEstimate) {
  if (estimate.measuredCycles === 0) {
    return "The ring uses a typical 28-day cycle until you log a second start. Then it will follow you.";
  }
  if (estimate.measuredCycles === 1) {
    return `The ring follows your last start-to-start of ${estimate.averageCycleLength} days.`;
  }
  return `The ring follows the average of ${estimate.measuredCycles} cycles (${estimate.averageCycleLength} days).`;
}

export function CycleRing({ estimate }: { estimate: CycleEstimate }) {
  if (!estimate.hasPeriod || estimate.cycleDay === null) return null;

  const progress = ringProgress(estimate);

  return (
    <div className="pattern-ring-wrap">
      <svg className="pattern-ring" viewBox="0 0 140 140" aria-hidden="true">
        <circle className="pattern-ring-track" cx="70" cy="70" r={RING} />
        <circle
          className="pattern-ring-arc"
          cx="70"
          cy="70"
          r={RING}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className="pattern-ring-label">
        <strong>{estimate.cycleDay}</strong>
        <span>of {estimate.averageCycleLength}</span>
      </div>
    </div>
  );
}
