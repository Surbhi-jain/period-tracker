import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingCalendar } from "./marketing-calendar";

describe("MarketingCalendar", () => {
  it("uses Luna’s next-start, shift and ovulation math", () => {
    render(<MarketingCalendar />);

    expect(screen.getByText("in 9 days")).toBeInTheDocument();
    expect(screen.getByText("around 14 Oct · may shift ±4 days")).toBeInTheDocument();
    expect(screen.queryByText(/14 – 22/)).toBeNull();
    expect(screen.getByText("Ovulation")).toBeInTheDocument();
  });

  it("keeps day numbers on coloured and empty days", () => {
    render(<MarketingCalendar compact showCaption={false} />);

    expect(screen.getByText("October 2026")).toBeInTheDocument();
    for (const day of ["1", "5", "9", "14", "18", "31"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
    expect(screen.getAllByText("27")).toHaveLength(2);
  });
});
