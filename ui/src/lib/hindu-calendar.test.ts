import { describe, expect, it } from "vitest";
import { hinduDay, nextPeakOnOrAfter } from "./hindu-calendar";

describe("hinduDay", () => {
  it("marks published 2026 Purnima dates as the full moon tithi", () => {
    expect(hinduDay("2026-01-03").peak).toBe("purnima");
    expect(hinduDay("2026-01-03").paksha).toBe("shukla");
    expect(hinduDay("2026-09-26").peak).toBe("purnima");
    expect(hinduDay("2026-10-26").peak).toBe("purnima");
  });

  it("marks published 2026 Amavasya dates as the new moon tithi", () => {
    expect(hinduDay("2026-01-18").peak).toBe("amavasya");
    expect(hinduDay("2026-01-18").paksha).toBe("krishna");
    expect(hinduDay("2026-09-11").peak).toBe("amavasya");
    expect(hinduDay("2026-10-10").peak).toBe("amavasya");
  });

  it("finds the next published peak on or after a date", () => {
    expect(nextPeakOnOrAfter("2026-01-10", "amavasya")).toBe("2026-01-18");
    expect(nextPeakOnOrAfter("2026-01-18", "amavasya")).toBe("2026-01-18");
    expect(nextPeakOnOrAfter("2026-09-12", "purnima")).toBe("2026-09-26");
  });

  it("reads a day after Amavasya as early Shukla paksha", () => {
    const day = hinduDay("2026-09-12");
    expect(day.paksha).toBe("shukla");
    expect(day.tithiName).toMatch(/Pratipada|Dwitiya/);
  });
});
