import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BlogPostPage from "./page";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("journal note", () => {
  it("renders a post with a tracker link and a health warning", async () => {
    render(
      await BlogPostPage({
        params: Promise.resolve({ slug: "period-calendar-is-not-contraception" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "A period calendar cannot predict a safe day" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ovulation can move/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open tracker" })[0]).toHaveAttribute(
      "href",
      "/tracker",
    );
    expect(screen.getByRole("link", { name: "← All notes" })).toHaveAttribute("href", "/blog");
    expect(screen.getAllByText(/must not be used as contraception/).length).toBeGreaterThan(0);
  });
});
