import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CycleEstimateCard,
  fertileLabel,
  ovulationLabel,
  pmsLabel,
  timingLabel,
} from "./cycle-estimate-card";
import { estimateCycle } from "@/lib/cycle-estimate";

const entries = [
  { id: "1", startDate: "2026-01-01", endDate: "2026-01-05" },
];

describe("timingLabel", () => {
  it("describes period, late, window, and countdown states", () => {
    expect(
      timingLabel(estimateCycle(entries, "2026-01-03")),
    ).toBe("Bleeding in progress");
    expect(
      timingLabel(estimateCycle(entries, "2026-02-10")),
    ).toBe("May be late");
    expect(
      timingLabel(estimateCycle(entries, "2026-01-29")),
    ).toBe("Expected around now");
    expect(
      timingLabel(estimateCycle(entries, "2026-01-10")),
    ).toBe("19 days");
  });
});

describe("fertileLabel and ovulationLabel", () => {
  it("counts down before the fertile window", () => {
    const estimate = estimateCycle(entries, "2026-01-08");
    expect(fertileLabel(estimate)).toBe("Starts in 2 days");
    expect(ovulationLabel(estimate)).toBe("in 7 days");
  });

  it("says when today is fertile or ovulation day", () => {
    expect(fertileLabel(estimateCycle(entries, "2026-01-12"))).toBe(
      "You may be fertile today",
    );
    expect(ovulationLabel(estimateCycle(entries, "2026-01-15"))).toBe(
      "Estimated for today",
    );
  });

  it("says when the window has passed for this cycle", () => {
    const estimate = estimateCycle(entries, "2026-01-20");
    expect(fertileLabel(estimate)).toBe("Passed for this cycle");
    expect(ovulationLabel(estimate)).toBe("Passed for this cycle");
  });

  it("uses singular wording for one day", () => {
    expect(ovulationLabel(estimateCycle(entries, "2026-01-14"))).toBe("in 1 day");
  });
});

describe("pmsLabel", () => {
  it("counts down to PMS days, then flags them", () => {
    expect(pmsLabel(estimateCycle(entries, "2026-01-10"))).toBe("Starts in 14 days");
    expect(pmsLabel(estimateCycle(entries, "2026-01-23"))).toBe("Starts in 1 day");
    expect(pmsLabel(estimateCycle(entries, "2026-01-24"))).toBe(
      "PMS symptoms may show up now",
    );
  });

  it("says when PMS days have passed", () => {
    expect(pmsLabel(estimateCycle(entries, "2026-02-01"))).toBe("Passed for this cycle");
  });
});

describe("CycleEstimateCard", () => {
  it("asks the user to log a period when there is no history", () => {
    render(<CycleEstimateCard entries={[]} today="2026-09-30" />);

    expect(screen.getByRole("heading", { name: "Next period estimate" })).toBeInTheDocument();
    expect(
      screen.getByText(/Log a period below to see cycle day/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/never treats this as a diagnosis/),
    ).toBeInTheDocument();
  });

  it("shows the estimated range and confidence after a period is logged", () => {
    render(<CycleEstimateCard entries={entries} today="2026-01-10" />);

    expect(screen.getByText("Low confidence")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("of 28")).toBeInTheDocument();
    expect(screen.queryByText("19 days")).toBeNull();
    expect(screen.getByText("5 days")).toBeInTheDocument();
    expect(screen.getByText("±4 days")).toBeInTheDocument();
    expect(screen.getByText(/typical 28-day cycle/)).toBeInTheDocument();
    expect(
      screen.getByText(/estimate, not a medical diagnosis/),
    ).toBeInTheDocument();
  });

  it("keeps fertile window, ovulation and PMS off the estimate card", () => {
    render(<CycleEstimateCard entries={entries} today="2026-01-08" />);

    expect(screen.queryByText("Fertile window")).toBeNull();
    expect(screen.queryByText("Estimated ovulation")).toBeNull();
    expect(screen.queryByText("PMS days")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "About fertile window, ovulation and PMS" }),
    ).toBeNull();
  });
});
