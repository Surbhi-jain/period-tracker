import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { estimateCycle } from "@/lib/cycle-estimate";
import { CycleRing, patternNote, patternTitle, ringProgress } from "./cycle-pattern";

const one = [{ id: "1", startDate: "2026-01-01", endDate: "2026-01-05" }];
const two = [
  { id: "1", startDate: "2025-12-04", endDate: "2025-12-07" },
  { id: "2", startDate: "2026-01-01", endDate: "2026-01-05" },
];

describe("patternTitle and ringProgress", () => {
  it("names the day without listing fertile or PMS", () => {
    expect(patternTitle(estimateCycle(one, "2026-01-03"))).toBe("Bleeding, day 3");
    expect(patternTitle(estimateCycle(one, "2026-01-10"))).toBe("Day 10");
    expect(patternTitle(estimateCycle(one, "2026-02-10"))).toBe("Past the usual length");
    expect(ringProgress(estimateCycle(one, "2026-01-10"))).toBeCloseTo(10 / 28);
    expect(ringProgress(estimateCycle(one, "2026-02-10"))).toBe(1);
  });
});

describe("patternNote", () => {
  it("explains when the ring is still using 28 days", () => {
    expect(patternNote(estimateCycle(one, "2026-01-10"))).toMatch(/typical 28-day cycle/);
  });

  it("switches to the logged start-to-start after a second period", () => {
    expect(patternNote(estimateCycle(two, "2026-01-10"))).toMatch(/28 days/);
    expect(patternNote(estimateCycle(two, "2026-01-10"))).toMatch(/start-to-start|average/i);
  });
});

describe("CycleRing", () => {
  it("shows cycle day on the ring without repeating period length or a second heading", () => {
    render(<CycleRing estimate={estimateCycle(one, "2026-01-10")} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("of 28")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Day 10" })).toBeNull();
    expect(screen.queryByText("Last bleed")).toBeNull();
    expect(screen.queryByText(/fertile/i)).toBeNull();
  });
});
