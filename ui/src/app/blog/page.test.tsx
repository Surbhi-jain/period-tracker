import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { listPosts } from "@/lib/blog";
import BlogIndexPage from "./page";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("journal index", () => {
  it("lists every note and says dates are not contraception", () => {
    render(<BlogIndexPage />);

    expect(screen.getByRole("heading", { level: 1, name: /Notes on periods and health/ })).toBeInTheDocument();
    expect(screen.getByText("What cycle patterns can show, and what they cannot.")).toBeInTheDocument();
    for (const post of listPosts()) {
      expect(screen.getByRole("heading", { name: post.title })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: post.title })[0]).toHaveAttribute(
        "href",
        `/blog/${post.slug}`,
      );
    }
    expect(screen.getAllByText(/must not be used as contraception/).length).toBeGreaterThan(0);
  });
});
