import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("SiteHeader", () => {
  it("keeps Open tracker and sign-in in the phone menu", () => {
    render(<SiteHeader variant="marketing" />);

    expect(screen.getAllByRole("link", { name: "Open tracker" }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Mobile" })).toHaveTextContent("Open tracker");
    expect(screen.getAllByRole("button", { name: /Continue with Google|Sign in/ }).length).toBeGreaterThan(
      0,
    );
  });

  it("keeps Google sign-in on the app header", () => {
    render(<SiteHeader variant="app" />);

    expect(screen.queryByLabelText("Menu")).toBeNull();
    expect(screen.getByRole("button", { name: /Continue with Google|Sign in/ })).toBeInTheDocument();
  });
});
