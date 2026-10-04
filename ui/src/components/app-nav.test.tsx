import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "./app-nav";

const usePathname = vi.fn(() => "/tracker");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("AppNav", () => {
  it("opens Moon and tithi as its own page from the top of the app", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Tracker" })).toHaveAttribute("href", "/tracker");
    expect(screen.getByRole("link", { name: "Moon and tithi" })).toHaveAttribute(
      "href",
      "/tracker/tithi",
    );
    expect(screen.getByRole("link", { name: "Tracker" })).toHaveClass("is-active");
  });
});
