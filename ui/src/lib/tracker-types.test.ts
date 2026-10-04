import { describe, expect, it } from "vitest";
import type { PeriodRecord } from "./tracker-types";

describe("PeriodRecord", () => {
  it("stores only start and end days of bleeding", () => {
    const record: PeriodRecord = {
      id: "abc",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    };
    expect(record).toEqual({
      id: "abc",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });
    expect(record).not.toHaveProperty("age");
  });
});
