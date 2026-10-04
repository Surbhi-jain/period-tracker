import { describe, expect, it } from "vitest";
import { HEALTH_DISCLAIMER } from "./site";

describe("site copy", () => {
  it("uses one health warning across the site", () => {
    expect(HEALTH_DISCLAIMER).toMatch(/not a diagnosis/);
    expect(HEALTH_DISCLAIMER).toMatch(/must not be used as contraception/);
  });
});
