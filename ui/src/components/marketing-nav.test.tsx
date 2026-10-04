import { describe, expect, it } from "vitest";
import { isNavActive } from "./marketing-nav";

describe("isNavActive", () => {
  it("marks Features when the home page is on that section", () => {
    expect(isNavActive("/", "/#features", "#features")).toBe(true);
    expect(isNavActive("/", "/#faq", "#features")).toBe(false);
    expect(isNavActive("/blog", "/#features", "#features")).toBe(false);
  });

  it("marks Journal on journal pages", () => {
    expect(isNavActive("/blog", "/blog", "")).toBe(true);
    expect(isNavActive("/blog/start-day-of-bleeding", "/blog", "")).toBe(true);
    expect(isNavActive("/", "/blog", "")).toBe(false);
  });
});
