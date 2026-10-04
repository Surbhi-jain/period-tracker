import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  formatDate,
  formatShortRange,
  formatWeekdayDate,
  isIsoDate,
  latestAllowedDate,
  rangesOverlap,
  startToStartDays,
  todayLocal,
  todayUtc,
  toUtcDate,
} from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("toUtcDate", () => {
  it("parses a calendar date as midnight UTC", () => {
    const date = toUtcDate("2026-09-30");
    expect(date.toISOString()).toBe("2026-09-30T00:00:00.000Z");
  });
});

describe("todayLocal", () => {
  it("uses the computer's local calendar date, not UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 23, 30, 0));
    expect(todayLocal()).toBe("2026-09-30");
  });

  it("pads month and day to two digits", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 8, 0, 0));
    expect(todayLocal()).toBe("2026-01-05");
  });
});

describe("todayUtc", () => {
  it("matches todayLocal so IST midnight is not treated as yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 6, 0, 0));
    expect(todayUtc()).toBe(todayLocal());
  });
});

describe("rangesOverlap", () => {
  it("detects overlapping inclusive date ranges", () => {
    expect(rangesOverlap("2026-01-01", "2026-01-05", "2026-01-05", "2026-01-08")).toBe(true);
    expect(rangesOverlap("2026-01-01", "2026-01-05", "2026-01-06", "2026-01-08")).toBe(false);
    expect(rangesOverlap("2026-01-10", "2026-01-12", "2026-01-01", "2026-01-20")).toBe(true);
  });
});

describe("formatDate", () => {
  it("formats a UTC civil date for India English", () => {
    expect(formatDate("2026-01-15")).toBe("15 Jan 2026");
  });
});

describe("startToStartDays and daysBetween", () => {
  it("counts days from start to start", () => {
    expect(startToStartDays("2026-01-01", "2026-01-29")).toBe(28);
    expect(startToStartDays("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("counts inclusive bleeding days", () => {
    expect(daysBetween("2026-01-01", "2026-01-05")).toBe(5);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(1);
  });
});

describe("isIsoDate", () => {
  it("accepts only real calendar days", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-1-5")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("latestAllowedDate", () => {
  it("allows one day past UTC so time zones ahead of UTC can log today", () => {
    expect(latestAllowedDate(new Date("2026-10-02T20:00:00Z"))).toBe("2026-10-03");
  });
});

describe("formatShortRange", () => {
  it("writes a same-month span without repeating the month", () => {
    expect(formatShortRange("2026-01-10", "2026-01-15")).toBe("10–15 Jan");
    expect(formatShortRange("2026-01-16", "2026-01-16")).toBe("16 Jan");
  });

  it("keeps both months when a span crosses them", () => {
    expect(formatShortRange("2026-01-29", "2026-02-02")).toBe("29 Jan – 2 Feb");
  });
});

describe("formatWeekdayDate", () => {
  it("names the weekday for the day panel", () => {
    expect(formatWeekdayDate("2026-01-08")).toMatch(/Thursday/);
    expect(formatWeekdayDate("2026-01-08")).toMatch(/8/);
    expect(formatWeekdayDate("2026-01-08")).toMatch(/January/);
  });
});

describe("addDays", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-30", 2)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
