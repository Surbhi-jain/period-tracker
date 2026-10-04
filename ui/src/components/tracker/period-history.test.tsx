import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { latestHistoryEntries, PeriodHistory } from "./period-history";

const entries = [
  { id: "1", startDate: "2026-03-06", endDate: "2026-03-09" },
  { id: "2", startDate: "2026-04-04", endDate: "2026-04-07" },
  { id: "3", startDate: "2026-04-29", endDate: "2026-05-03" },
  { id: "4", startDate: "2026-05-26", endDate: "2026-05-29" },
  { id: "5", startDate: "2026-06-28", endDate: "2026-07-01" },
  { id: "6", startDate: "2026-07-22", endDate: "2026-07-25" },
  { id: "7", startDate: "2026-08-18", endDate: "2026-08-21" },
  { id: "8", startDate: "2026-09-12", endDate: "2026-09-14" },
];

describe("latestHistoryEntries", () => {
  it("keeps only the three newest starts", () => {
    expect(latestHistoryEntries(entries).map((entry) => entry.startDate)).toEqual([
      "2026-09-12",
      "2026-08-18",
      "2026-07-22",
    ]);
  });
});

describe("PeriodHistory", () => {
  it("shows the three latest periods and points older ones to the calendar", () => {
    render(
      <PeriodHistory entries={entries} editingId={null} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Latest periods" })).toBeInTheDocument();
    expect(screen.getByText("3 of 8")).toBeInTheDocument();
    expect(screen.getByText("12 Sept 2026 – 14 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("18 Aug 2026 – 21 Aug 2026")).toBeInTheDocument();
    expect(screen.getByText("22 Jul 2026 – 25 Jul 2026")).toBeInTheDocument();
    expect(screen.queryByText("6 Mar 2026 – 9 Mar 2026")).toBeNull();
    expect(screen.queryByText("26 May 2026 – 29 May 2026")).toBeNull();
    expect(
      screen.getByRole("link", {
        name: /5 earlier periods are on the calendar. Tap a logged day to change one./,
      }),
    ).toHaveAttribute("href", "#tracker-calendar");
  });

  it("does not mention hidden periods when three or fewer are logged", () => {
    render(
      <PeriodHistory
        entries={entries.slice(0, 2)}
        editingId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("2 entries")).toBeInTheDocument();
    expect(
      screen.getByText("These dates also sit on the calendar above. Tap a logged day to change one."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /earlier/ })).toBeNull();
  });
});
