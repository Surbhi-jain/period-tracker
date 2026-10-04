import { describe, expect, it } from "vitest";
import {
  DEFAULT_CYCLE_LENGTH,
  FERTILE_WINDOW_DAYS,
  LUTEAL_PHASE_DAYS,
  PMS_DAYS,
  estimateCycle,
} from "./cycle-estimate";

const period = (id: string, startDate: string, endDate: string) => ({
  id,
  startDate,
  endDate,
});

describe("estimateCycle", () => {
  it("asks for a first period when history is empty", () => {
    const estimate = estimateCycle([], "2026-09-30");

    expect(estimate.hasPeriod).toBe(false);
    expect(estimate.cycleDay).toBeNull();
    expect(estimate.averageCycleLength).toBe(DEFAULT_CYCLE_LENGTH);
    expect(estimate.estimatedNextStart).toBeNull();
    expect(estimate.confidence).toBe("low");
    expect(estimate.explanation).toMatch(/Log a period/);
  });

  it("uses a typical 28-day cycle after one logged period", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-10",
    );

    expect(estimate.hasPeriod).toBe(true);
    expect(estimate.measuredCycles).toBe(0);
    expect(estimate.averageCycleLength).toBe(28);
    expect(estimate.averagePeriodDuration).toBe(5);
    expect(estimate.estimatedNextStart).toBe("2026-01-29");
    expect(estimate.rangeStart).toBe("2026-01-25");
    expect(estimate.rangeEnd).toBe("2026-02-02");
    expect(estimate.cycleDay).toBe(10);
    expect(estimate.daysUntil).toBe(19);
    expect(estimate.isOnPeriod).toBe(false);
    expect(estimate.isLate).toBe(false);
    expect(estimate.confidence).toBe("low");
    expect(estimate.explanation).toMatch(/typical 28-day cycle/);
  });

  it("marks the current period as in progress", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-03",
    );

    expect(estimate.isOnPeriod).toBe(true);
    expect(estimate.cycleDay).toBe(3);
    expect(estimate.isLate).toBe(false);
  });

  it("marks the estimate as late after the expected window", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-02-10",
    );

    expect(estimate.isOnPeriod).toBe(false);
    expect(estimate.isInWindow).toBe(false);
    expect(estimate.isLate).toBe(true);
  });

  it("marks today as inside the expected window", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-29",
    );

    expect(estimate.isInWindow).toBe(true);
    expect(estimate.daysUntil).toBe(0);
    expect(estimate.isLate).toBe(false);
  });

  it("averages one measured cycle at medium confidence", () => {
    const estimate = estimateCycle(
      [
        period("1", "2026-01-01", "2026-01-05"),
        period("2", "2026-01-29", "2026-02-02"),
      ],
      "2026-02-10",
    );

    expect(estimate.measuredCycles).toBe(1);
    expect(estimate.averageCycleLength).toBe(28);
    expect(estimate.confidence).toBe("medium");
    expect(estimate.explanation).toMatch(/1 recorded cycle \(28 days/);
  });

  it("raises confidence when three regular cycles are logged", () => {
    const estimate = estimateCycle(
      [
        period("1", "2026-01-01", "2026-01-05"),
        period("2", "2026-01-29", "2026-02-02"),
        period("3", "2026-02-26", "2026-03-01"),
        period("4", "2026-03-26", "2026-03-30"),
      ],
      "2026-04-01",
    );

    expect(estimate.measuredCycles).toBe(3);
    expect(estimate.averageCycleLength).toBe(28);
    expect(estimate.confidence).toBe("high");
    expect(estimate.explanation).toMatch(/average of 3 recorded cycles/);
  });

  it("ignores cycle gaps shorter than 15 days or longer than 60", () => {
    const estimate = estimateCycle(
      [
        period("1", "2026-01-01", "2026-01-03"),
        period("2", "2026-01-10", "2026-01-12"),
        period("3", "2026-04-01", "2026-04-04"),
      ],
      "2026-04-10",
    );

    expect(estimate.measuredCycles).toBe(0);
    expect(estimate.averageCycleLength).toBe(DEFAULT_CYCLE_LENGTH);
  });

  it("ignores period lengths outside 1 to 20 days", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-25")],
      "2026-01-26",
    );

    expect(estimate.averagePeriodDuration).toBeNull();
  });

  it("has no ovulation estimate without any logged period", () => {
    const estimate = estimateCycle([], "2026-01-10");

    expect(estimate.ovulationDate).toBeNull();
    expect(estimate.fertileStart).toBeNull();
    expect(estimate.fertileEnd).toBeNull();
    expect(estimate.isFertileToday).toBe(false);
  });

  it("estimates ovulation 14 days before the next expected period", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-08",
    );

    expect(LUTEAL_PHASE_DAYS).toBe(14);
    expect(estimate.estimatedNextStart).toBe("2026-01-29");
    expect(estimate.ovulationDate).toBe("2026-01-15");
    expect(estimate.daysUntilOvulation).toBe(7);
    expect(estimate.isOvulationToday).toBe(false);
  });

  it("uses a 6-day fertile window ending on ovulation day", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-08",
    );

    expect(FERTILE_WINDOW_DAYS).toBe(6);
    expect(estimate.fertileStart).toBe("2026-01-10");
    expect(estimate.fertileEnd).toBe("2026-01-15");
    expect(estimate.isFertileToday).toBe(false);
  });

  it("flags fertile days and ovulation day", () => {
    const entries = [period("1", "2026-01-01", "2026-01-05")];

    expect(estimateCycle(entries, "2026-01-09").isFertileToday).toBe(false);
    expect(estimateCycle(entries, "2026-01-10").isFertileToday).toBe(true);
    expect(estimateCycle(entries, "2026-01-15").isFertileToday).toBe(true);
    expect(estimateCycle(entries, "2026-01-15").isOvulationToday).toBe(true);
    expect(estimateCycle(entries, "2026-01-16").isFertileToday).toBe(false);
  });

  it("moves ovulation with a longer measured cycle", () => {
    const estimate = estimateCycle(
      [
        period("1", "2026-01-01", "2026-01-05"),
        period("2", "2026-02-02", "2026-02-06"),
      ],
      "2026-02-10",
    );

    expect(estimate.averageCycleLength).toBe(32);
    expect(estimate.estimatedNextStart).toBe("2026-03-06");
    expect(estimate.ovulationDate).toBe("2026-02-20");
    expect(estimate.fertileStart).toBe("2026-02-15");
  });

  it("reports how many days the estimate may shift", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-08",
    );

    expect(estimate.shiftDays).toBe(4);
  });

  it("puts PMS days in the 5 days before the next expected period", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-05")],
      "2026-01-10",
    );

    expect(PMS_DAYS).toBe(5);
    expect(estimate.pmsStart).toBe("2026-01-24");
    expect(estimate.pmsEnd).toBe("2026-01-28");
    expect(estimate.isPmsToday).toBe(false);
  });

  it("flags PMS days, but not after the period is expected", () => {
    const entries = [period("1", "2026-01-01", "2026-01-05")];

    expect(estimateCycle(entries, "2026-01-23").isPmsToday).toBe(false);
    expect(estimateCycle(entries, "2026-01-24").isPmsToday).toBe(true);
    expect(estimateCycle(entries, "2026-01-28").isPmsToday).toBe(true);
    expect(estimateCycle(entries, "2026-01-29").isPmsToday).toBe(false);
  });

  it("does not call it PMS while a logged period is in progress", () => {
    const estimate = estimateCycle(
      [period("1", "2026-01-01", "2026-01-25")],
      "2026-01-24",
    );

    expect(estimate.isOnPeriod).toBe(true);
    expect(estimate.isPmsToday).toBe(false);
  });

  it("has no PMS window without any logged period", () => {
    const estimate = estimateCycle([], "2026-01-10");
    expect(estimate.pmsStart).toBeNull();
    expect(estimate.pmsEnd).toBeNull();
    expect(estimate.isPmsToday).toBe(false);
  });

  it("sorts entries before measuring, so input order does not matter", () => {
    const estimate = estimateCycle(
      [
        period("2", "2026-01-29", "2026-02-02"),
        period("1", "2026-01-01", "2026-01-05"),
      ],
      "2026-02-10",
    );

    expect(estimate.measuredCycles).toBe(1);
    expect(estimate.estimatedNextStart).toBe("2026-02-26");
  });
});
