import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PERIODS_KEY } from "@/lib/tracker-store";
import { TithiApp } from "./tithi-app";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
}));

vi.mock("@/lib/dates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dates")>();
  return { ...actual, todayLocal: () => "2026-01-10" };
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TithiApp", () => {
  it("maps a logged start and end to tithi without calling it a diagnosis", async () => {
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([{ id: "1", startDate: "2026-09-12", endDate: "2026-09-14" }]),
    );

    render(<TithiApp />);

    expect(await screen.findByRole("heading", { level: 1, name: "Moon and tithi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pratipada" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When bleeding sat in the lunar month" })).toBeInTheDocument();
    expect(screen.getByText(/what the line shows/i)).toBeInTheDocument();
    expect(screen.getByText(/One start cannot show a pattern yet/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Logged dates and tithi" })).toBeNull();
    expect(screen.getAllByText(/Shukla paksha/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 Sept 2026/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 day after Amavasya/)).toBeInTheDocument();
    expect(screen.getByText("Starts in Shukla paksha")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Back to tracker" })).toHaveAttribute("href", "/tracker");
    expect(
      screen.getByText(
        "Each start day is placed on its tithi. This is a date reading, not a diagnosis.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not name Hindu months/)).toBeInTheDocument();
    expect(screen.getAllByText(/not a diagnosis/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/fertile/i)).toBeNull();
  });

  it("asks for a period when none are logged", async () => {
    render(<TithiApp />);

    expect(await screen.findByRole("heading", { name: "Log a period first" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open tracker" })).toHaveAttribute("href", "/tracker");
  });
});
