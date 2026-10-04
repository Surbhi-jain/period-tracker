import { describe, expect, it } from "vitest";
import {
  buildCalendarMonth,
  monthStart,
  periodOnDate,
  projectCycles,
  shiftMonth,
  type CalendarDay,
} from "./calendar";

const entries = [{ id: "1", startDate: "2026-01-01", endDate: "2026-01-05" }];

function dayOf(days: CalendarDay[][], date: string) {
  const found = days.flat().find((day) => day.date === date);
  if (!found) throw new Error(`No calendar cell for ${date}`);
  return found;
}

describe("monthStart and shiftMonth", () => {
  it("builds the first day of a month", () => {
    expect(monthStart(2026, 0)).toBe("2026-01-01");
    expect(monthStart(2026, 11)).toBe("2026-12-01");
  });

  it("moves across year boundaries", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 5, 14)).toEqual({ year: 2027, month: 7 });
  });
});

describe("projectCycles", () => {
  it("returns nothing before any period is logged", () => {
    expect(projectCycles([], "2026-01-08")).toEqual([]);
  });

  it("projects future cycles at the average cycle length", () => {
    const cycles = projectCycles(entries, "2026-01-08", 2);

    expect(cycles[0]).toMatchObject({
      start: "2026-01-29",
      periodEnd: "2026-02-02",
      rangeStart: "2026-01-25",
      rangeEnd: "2026-02-02",
      ovulation: "2026-01-15",
      fertileStart: "2026-01-10",
      pmsStart: "2026-01-24",
      pmsEnd: "2026-01-28",
      shiftDays: 4,
    });
    expect(cycles[1].start).toBe("2026-02-26");
    expect(cycles[1].ovulation).toBe("2026-02-12");
  });
});

describe("buildCalendarMonth", () => {
  const january = buildCalendarMonth(2026, 0, entries, "2026-01-08");

  it("lays out Sunday-first weeks and drops empty leftover weeks", () => {
    expect(january.label).toBe("January 2026");
    expect(january.weeks).toHaveLength(5);
    expect(january.weeks.every((week) => week.length === 7)).toBe(true);
    expect(january.weeks[0][0].date).toBe("2025-12-28");
    expect(january.weeks[4][6].date).toBe("2026-01-31");
    expect(dayOf(january.weeks, "2025-12-28").inMonth).toBe(false);
    expect(dayOf(january.weeks, "2026-01-01").inMonth).toBe(true);
  });

  it("marks today", () => {
    expect(dayOf(january.weeks, "2026-01-08").isToday).toBe(true);
    expect(dayOf(january.weeks, "2026-01-09").isToday).toBe(false);
  });

  it("colours logged period days with a default medium flow", () => {
    expect(dayOf(january.weeks, "2026-01-01").flow).toBe("medium");
    expect(dayOf(january.weeks, "2026-01-05").flow).toBe("medium");
    expect(dayOf(january.weeks, "2026-01-06").flow).toBeNull();
  });

  it("uses darker flow levels when they are recorded", () => {
    const month = buildCalendarMonth(2026, 0, entries, "2026-01-08", {
      "2026-01-01": "heavy",
      "2026-01-05": "light",
    });

    expect(dayOf(month.weeks, "2026-01-01").flow).toBe("heavy");
    expect(dayOf(month.weeks, "2026-01-05").flow).toBe("light");
  });

  it("marks the fertile window and ovulation day", () => {
    expect(dayOf(january.weeks, "2026-01-09").isFertile).toBe(false);
    expect(dayOf(january.weeks, "2026-01-10").isFertile).toBe(true);
    expect(dayOf(january.weeks, "2026-01-15").isFertile).toBe(true);
    expect(dayOf(january.weeks, "2026-01-15").isOvulation).toBe(true);
    expect(dayOf(january.weeks, "2026-01-16").isFertile).toBe(false);
  });

  it("marks PMS days before the predicted period", () => {
    expect(dayOf(january.weeks, "2026-01-23").isPms).toBe(false);
    expect(dayOf(january.weeks, "2026-01-24").isPms).toBe(true);
    expect(dayOf(january.weeks, "2026-01-28").isPms).toBe(true);
    expect(dayOf(january.weeks, "2026-01-29").isPms).toBe(false);
  });

  it("marks the predicted period and the may-shift range", () => {
    const start = dayOf(january.weeks, "2026-01-29");
    expect(start.isPredictedPeriod).toBe(true);
    expect(start.isPredictedStart).toBe(true);
    expect(start.shiftDays).toBe(4);

    expect(dayOf(january.weeks, "2026-01-24").mayShift).toBe(false);
    expect(dayOf(january.weeks, "2026-01-25").mayShift).toBe(true);
    expect(dayOf(january.weeks, "2026-01-31").mayShift).toBe(true);
    expect(dayOf(january.weeks, "2026-01-31").isPredictedPeriod).toBe(true);
  });

  it("summarises the month in plain chips", () => {
    expect(january.highlights.map((item) => item.label)).toEqual([
      "Logged 1–5 Jan",
      "Fertile 10–15 Jan",
      "Ovulation 15 Jan",
      "PMS 24–28 Jan",
      "Period around 29 Jan ±4",
    ]);
  });

  it("shows predictions for later months too", () => {
    const february = buildCalendarMonth(2026, 1, entries, "2026-01-08");

    expect(dayOf(february.weeks, "2026-02-12").isOvulation).toBe(true);
    expect(dayOf(february.weeks, "2026-02-26").isPredictedStart).toBe(true);
  });

  it("never overlays predictions on a logged period day", () => {
    const withLoggedPrediction = [
      ...entries,
      { id: "2", startDate: "2026-01-29", endDate: "2026-01-30" },
    ];
    const month = buildCalendarMonth(2026, 0, withLoggedPrediction, "2026-01-30");
    const day = dayOf(month.weeks, "2026-01-29");

    expect(day.flow).toBe("medium");
    expect(day.isPredictedPeriod).toBe(false);
    expect(day.isFertile).toBe(false);
    expect(day.mayShift).toBe(false);
  });

  it("only shows logged days when there is nothing to predict from", () => {
    const empty = buildCalendarMonth(2026, 0, [], "2026-01-08");
    const marked = empty.weeks
      .flat()
      .filter((day) => day.flow || day.isFertile || day.isPms || day.isPredictedPeriod);

    expect(marked).toEqual([]);
  });
});

describe("periodOnDate", () => {
  it("finds the logged period that covers a day", () => {
    const older = { id: "old", startDate: "2025-10-01", endDate: "2025-10-04" };
    expect(periodOnDate([older, ...entries], "2026-01-03")).toEqual(entries[0]);
    expect(periodOnDate([older, ...entries], "2025-10-04")).toEqual(older);
    expect(periodOnDate(entries, "2026-01-08")).toBeNull();
  });
});
