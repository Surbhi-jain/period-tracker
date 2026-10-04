import { describe, expect, it } from "vitest";
import {
  isUuid,
  PERIOD_ERROR,
  periodFromRow,
  periodOverlaps,
  validatePeriodInput,
} from "./validation";

describe("validatePeriodInput", () => {
  it("requires both bleeding days", () => {
    expect(validatePeriodInput("", "2026-01-05")).toBe(PERIOD_ERROR.missing);
    expect(validatePeriodInput("2026-01-01", "")).toBe(PERIOD_ERROR.missing);
  });

  it("rejects an end day before the start day", () => {
    expect(validatePeriodInput("2026-01-05", "2026-01-01")).toBe(
      PERIOD_ERROR.endBeforeStart,
    );
  });

  it("rejects future dates when today is provided", () => {
    expect(
      validatePeriodInput("2026-10-01", "2026-10-02", { today: "2026-09-30" }),
    ).toBe(PERIOD_ERROR.future);
  });

  it("rejects a period longer than 20 days", () => {
    expect(validatePeriodInput("2026-01-01", "2026-01-22")).toBe(
      PERIOD_ERROR.tooLong,
    );
  });

  it("accepts a same-day period", () => {
    expect(validatePeriodInput("2026-01-01", "2026-01-01")).toBeNull();
  });
});

describe("strict input checks", () => {
  it("rejects dates that are not real YYYY-MM-DD calendar days", () => {
    expect(validatePeriodInput("2026-02-30", "2026-03-01")).toBe(PERIOD_ERROR.invalidDate);
    expect(validatePeriodInput("01/02/2026", "2026-01-03")).toBe(PERIOD_ERROR.invalidDate);
    expect(validatePeriodInput(20260101, "2026-01-03")).toBe(PERIOD_ERROR.invalidDate);
    expect(validatePeriodInput("1850-01-01", "1850-01-03")).toBe(PERIOD_ERROR.invalidDate);
  });

  it("recognises uuids", () => {
    expect(isUuid("5d7bad85-43be-4c04-b6cb-3374258e07e0")).toBe(true);
    expect(isUuid("p1")).toBe(false);
    expect(isUuid("5d7bad85-43be-4c04-b6cb-3374258e07e0' or 1=1")).toBe(false);
  });
});

describe("periodOverlaps", () => {
  const saved = [
    { id: "a", startDate: "2026-01-01", endDate: "2026-01-05" },
    { id: "b", startDate: "2026-02-01", endDate: "2026-02-04" },
  ];

  it("finds an overlap with another saved period", () => {
    expect(periodOverlaps("2026-01-05", "2026-01-08", saved)).toBe(true);
    expect(periodOverlaps("2026-01-10", "2026-01-12", saved)).toBe(false);
  });

  it("ignores the period being edited", () => {
    expect(periodOverlaps("2026-01-01", "2026-01-05", saved, "a")).toBe(false);
    expect(periodOverlaps("2026-01-04", "2026-02-01", saved, "a")).toBe(true);
  });
});

describe("periodFromRow", () => {
  it("maps database columns to the tracker record", () => {
    expect(
      periodFromRow({
        id: "abc",
        start_date: "2026-01-01",
        end_date: "2026-01-05",
      }),
    ).toEqual({
      id: "abc",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });
  });
});
