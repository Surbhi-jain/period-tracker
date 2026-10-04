import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CycleCalendar, dayDetail, describeDay } from "./cycle-calendar";
import { buildCalendarMonth } from "@/lib/calendar";

const entries = [{ id: "1", startDate: "2026-01-01", endDate: "2026-01-05" }];

describe("describeDay", () => {
  it("reads out what each day means for screen readers", () => {
    const month = buildCalendarMonth(2026, 0, entries, "2026-01-08");
    const find = (date: string) =>
      month.weeks.flat().find((day) => day.date === date)!;

    expect(describeDay(find("2026-01-01"))).toBe("1 Jan 2026, bleeding, medium flow");
    expect(describeDay(find("2026-01-08"))).toBe("8 Jan 2026, today");
    expect(describeDay(find("2026-01-12"))).toBe("12 Jan 2026, fertile window");
    expect(describeDay(find("2026-01-15"))).toBe("15 Jan 2026, estimated ovulation");
    expect(describeDay(find("2026-01-26"))).toBe("26 Jan 2026, PMS days");
    expect(describeDay(find("2026-01-29"))).toBe(
      "29 Jan 2026, predicted period, may shift by 4 days either way",
    );
  });

  it("keeps fertile, ovulation and PMS out of the readout until asked", () => {
    const month = buildCalendarMonth(2026, 0, entries, "2026-01-08");
    const find = (date: string) =>
      month.weeks.flat().find((day) => day.date === date)!;

    expect(describeDay(find("2026-01-12"), false)).toBe("12 Jan 2026");
    expect(describeDay(find("2026-01-15"), false)).toBe("15 Jan 2026");
    expect(describeDay(find("2026-01-26"), false)).toBe("26 Jan 2026");
    expect(describeDay(find("2026-01-29"), false)).toMatch(/predicted period/);
  });
});

describe("dayDetail", () => {
  it("explains the selected day in plain language", () => {
    const month = buildCalendarMonth(2026, 0, entries, "2026-01-08");
    const find = (date: string) =>
      month.weeks.flat().find((day) => day.date === date)!;

    expect(dayDetail(find("2026-01-01")).title).toBe("Logged bleeding");
    expect(dayDetail(find("2026-01-15")).title).toBe("Estimated ovulation");
    expect(dayDetail(find("2026-01-15"), false).title).toBe("No mark on this day");
    expect(dayDetail(find("2026-01-29")).note).toMatch(/4 days/);
    expect(dayDetail(find("2026-01-08")).title).toBe("No period on 8 Jan 2026");
  });
});

describe("CycleCalendar", () => {
  it("opens on the current month with period chips only", () => {
    render(<CycleCalendar entries={entries} today="2026-01-08" />);

    expect(screen.getByRole("heading", { name: "January 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Period around 29 Jan ±4" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Sunday" })).toHaveTextContent("S");
    expect(screen.getByText("Logged bleeding")).toBeInTheDocument();
    expect(screen.getByText("Predicted period")).toBeInTheDocument();
    expect(screen.getByText("May shift ±")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fertile 10–15 Jan" })).toBeNull();
    expect(screen.queryByText("Fertile window")).toBeNull();
    expect(screen.queryByText("Ovulation day")).toBeNull();
    expect(screen.queryByText("PMS days")).toBeNull();
    expect(screen.queryByText(/must not be used as/)).toBeNull();
    expect(screen.queryByText("Light flow")).toBeNull();
    expect(screen.queryByRole("button", { name: "Back to today" })).toBeNull();
  });

  it("shows fertile, ovulation and PMS after they are asked for", () => {
    render(<CycleCalendar entries={entries} today="2026-01-08" />);

    fireEvent.click(
      screen.getByRole("button", { name: "About fertile window, ovulation and PMS" }),
    );

    expect(screen.getByRole("button", { name: "Fertile 10–15 Jan" })).toBeInTheDocument();
    expect(screen.getByText("Fertile window")).toBeInTheDocument();
    expect(screen.getByText("Ovulation day")).toBeInTheDocument();
    expect(screen.getByText("PMS days")).toBeInTheDocument();
    expect(screen.getByLabelText("15 Jan 2026, estimated ovulation")).toHaveClass(
      "is-ovulation",
      "is-single",
    );
    expect(screen.getByLabelText("26 Jan 2026, PMS days")).toHaveClass("is-pms");
    expect(screen.getByLabelText("12 Jan 2026, fertile window")).toHaveClass("is-mid");
    fireEvent.click(
      screen.getByRole("button", { name: "Hide fertile window, ovulation and PMS" }),
    );
    expect(screen.queryByRole("button", { name: "Fertile 10–15 Jan" })).toBeNull();
  });

  it("colours logged and predicted days without extras", () => {
    render(<CycleCalendar entries={entries} today="2026-01-08" />);

    expect(screen.getByLabelText("1 Jan 2026, bleeding, medium flow")).toHaveClass(
      "is-period",
      "flow-medium",
      "is-start",
    );
    expect(screen.getByLabelText("2 Jan 2026, bleeding, medium flow")).toHaveClass("is-mid");
    expect(screen.getByLabelText("3 Jan 2026, bleeding, medium flow")).toHaveClass("is-end");
    expect(screen.getByLabelText("15 Jan 2026")).not.toHaveClass("is-ovulation");
    expect(
      screen.getByLabelText(
        "29 Jan 2026, predicted period, may shift by 4 days either way",
      ),
    ).toHaveClass("is-predicted", "may-shift");
    expect(screen.getAllByText("±4")).toHaveLength(1);
  });

  it("explains a day when you tap it or a month chip", () => {
    render(<CycleCalendar entries={entries} today="2026-01-08" />);

    expect(screen.getByText("No period on 8 Jan 2026")).toBeInTheDocument();
    expect(screen.getByText("No bleeding or prediction on this day.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("15 Jan 2026"));
    expect(screen.getByText("No mark on this day")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Period around 29 Jan ±4" }));
    expect(screen.getByText("Predicted period start")).toBeInTheDocument();
  });

  it("moves between months and back to today", () => {
    render(<CycleCalendar entries={entries} today="2026-01-08" />);

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "February 2026" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "December 2025" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to today" }));
    expect(screen.getByRole("heading", { name: "January 2026" })).toBeInTheDocument();
  });

  it("lets you change a logged period from the selected day", () => {
    const onEditPeriod = vi.fn();
    render(
      <CycleCalendar entries={entries} today="2026-01-08" onEditPeriod={onEditPeriod} />,
    );

    expect(screen.queryByRole("button", { name: /Change the period covering/ })).toBeNull();
    fireEvent.click(screen.getByLabelText("1 Jan 2026, bleeding, medium flow"));
    fireEvent.click(
      screen.getByRole("button", { name: "Change the period covering 1 Jan 2026" }),
    );
    expect(onEditPeriod).toHaveBeenCalledWith(entries[0]);
  });
});
