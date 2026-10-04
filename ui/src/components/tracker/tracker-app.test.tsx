import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PERIODS_KEY, PROFILE_KEY } from "@/lib/tracker-store";
import { TrackerApp } from "./tracker-app";

const useSession = vi.fn();

vi.mock("@/lib/auth-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...actual,
    useSession: () => useSession(),
  };
});

vi.mock("@/lib/dates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dates")>();
  return { ...actual, todayLocal: () => "2026-01-10" };
});

beforeEach(() => {
  localStorage.clear();
  useSession.mockReturnValue({ status: "unauthenticated", data: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TrackerApp as a guest", () => {
  it("asks for the first period, then shows a welcome before the dashboard", async () => {
    render(<TrackerApp />);

    expect(
      await screen.findByRole("heading", { name: "When did bleeding last start?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saved only in this browser")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 28")).toBeNull();

    fireEvent.change(screen.getByLabelText("Start day of bleeding"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("End day of bleeding"), {
      target: { value: "2026-01-05" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save period" }));

    expect(await screen.findByRole("heading", { name: "Your calendar is ready" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See my tracker" }));

    const history = await screen.findByRole("region", { name: "Latest periods" });
    expect(within(history).getByText("1 Jan 2026 – 5 Jan 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Next period in 19 days" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next period estimate" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Record your period" })).toBeInTheDocument();
    expect(screen.getByLabelText("Start day of bleeding").closest(".date-input")).toBeTruthy();
    expect(document.querySelector(".dashboard-calendar")).toBeTruthy();
    expect(screen.getByText("of 28")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Day 10" })).toBeNull();
    expect(screen.queryByText("Last bleed")).toBeNull();
    expect(screen.queryByText(/Moon and tithi|MOON AND TITHI/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Add your age/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit age" })).toBeNull();
    expect(screen.queryByText("Fertile window")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "About fertile window, ovulation and PMS" }),
    );
    expect(screen.getByRole("button", { name: "Fertile 10–15 Jan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide fertile window, ovulation and PMS" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(PERIODS_KEY)!)).toHaveLength(1);
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
    expect(screen.queryByPlaceholderText("e.g. 28")).toBeNull();
  });

  it("can skip the first period and open the dashboard", async () => {
    render(<TrackerApp />);

    fireEvent.click(await screen.findByRole("button", { name: "I’ll log it later" }));

    expect(await screen.findByText("Your calendar will live here")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Your tracker" })).toBeInTheDocument();
    expect(screen.getByText(/Log a period under Record your period/)).toBeInTheDocument();
  });

  it("explains a problem instead of saving a future period", async () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ mode: "age", age: 29 }));
    render(<TrackerApp />);

    fireEvent.change(await screen.findByLabelText("Start day of bleeding"), {
      target: { value: "2026-01-11" },
    });
    fireEvent.change(screen.getByLabelText("End day of bleeding"), {
      target: { value: "2026-01-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save period" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Period dates cannot be in the future.",
    );
    expect(localStorage.getItem(PERIODS_KEY)).toBeNull();
  });

  it("updates a period from the history list", async () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ mode: "age", age: 29 }));
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([{ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }]),
    );
    render(<TrackerApp />);

    expect(await screen.findByRole("button", { name: "Update period from 1 Jan 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit age" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Update period from 1 Jan 2026" }));
    expect(screen.getByRole("heading", { name: "Update this period" })).toBeInTheDocument();
    expect(screen.getByText(/You are changing 1–5 Jan/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bleeding started today" })).toBeNull();
    expect(screen.getByLabelText("Start day of bleeding")).toHaveValue("2026-01-01");

    fireEvent.change(screen.getByLabelText("End day of bleeding"), {
      target: { value: "2026-01-06" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update period" }));

    expect(await screen.findByText("1 Jan 2026 – 6 Jan 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Record your period" })).toBeInTheDocument();
  });

  it("opens an older period from the calendar when it is not in the latest list", async () => {
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([
        { id: "oct", startDate: "2025-10-01", endDate: "2025-10-04" },
        { id: "nov", startDate: "2025-11-02", endDate: "2025-11-05" },
        { id: "dec", startDate: "2025-12-03", endDate: "2025-12-06" },
        { id: "jan", startDate: "2026-01-01", endDate: "2026-01-05" },
      ]),
    );
    render(<TrackerApp />);

    expect(await screen.findByText("3 of 4")).toBeInTheDocument();
    expect(screen.queryByText("1 Oct 2025 – 4 Oct 2025")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByLabelText("1 Oct 2025, bleeding, medium flow"));
    fireEvent.click(
      screen.getByRole("button", { name: "Change the period covering 1 Oct 2025" }),
    );

    expect(screen.getByRole("heading", { name: "Update this period" })).toBeInTheDocument();
    expect(screen.getByText(/You are changing 1–4 Oct/)).toBeInTheDocument();
    expect(screen.getByLabelText("Start day of bleeding")).toHaveValue("2025-10-01");
  });

  it("drops leftover age from this browser as soon as the tracker opens", async () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ mode: "age", age: 29 }));
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([{ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }]),
    );
    render(<TrackerApp />);

    expect(await screen.findByRole("heading", { name: "Next period estimate" })).toBeInTheDocument();
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
    expect(screen.queryByRole("button", { name: /age/i })).toBeNull();
    expect(screen.queryByText(/years old/)).toBeNull();
  });

  it("asks before deleting everything, then returns to the first period", async () => {
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([{ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }]),
    );
    render(<TrackerApp />);

    const button = await screen.findByRole("button", { name: /Delete all my data/ });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem(PERIODS_KEY)).not.toBeNull();

    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Delete everything" }));
    expect(
      await screen.findByRole("heading", { name: "When did bleeding last start?" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PERIODS_KEY)).toBeNull();
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
  });
});

describe("TrackerApp when signed in", () => {
  it("shows a retry screen when the account data cannot load", async () => {
    useSession.mockReturnValue({ status: "authenticated", data: { user: { email: "a@b.c" } } });
    const fetchMock = vi
      .spyOn(window, "fetch")
      .mockImplementation(
        async () => new Response(JSON.stringify({ error: "Database is down." }), { status: 500 }),
      );

    render(<TrackerApp />);

    expect(await screen.findByRole("heading", { name: "We could not load your saved data" }))
      .toBeInTheDocument();
    expect(screen.getByText("Database is down.")).toBeInTheDocument();

    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ periods: [] })));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "When did bleeding last start?" }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("31 years old")).toBeNull();
    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
  });

  it("tells you when dates from this browser moved into the Google account", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { email: "a@b.c" } },
    });
    localStorage.setItem(
      PERIODS_KEY,
      JSON.stringify([{ id: "local", startDate: "2026-01-01", endDate: "2026-01-05" }]),
    );
    vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      if (String(input).endsWith("/periods") && !init?.method) {
        return new Response(JSON.stringify({ periods: [] }));
      }
      return new Response(
        JSON.stringify({ period: { id: "cloud", startDate: "2026-01-01", endDate: "2026-01-05" } }),
      );
    });

    render(<TrackerApp />);

    expect(
      await screen.findByText(/Dates from this browser were saved to your Google account/),
    ).toBeInTheDocument();
  });
});
