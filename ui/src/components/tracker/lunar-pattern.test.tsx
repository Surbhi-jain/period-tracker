import { describe, expect, it } from "vitest";
import { MoonGlyph } from "./lunar-pattern";
import { render } from "@testing-library/react";

describe("MoonGlyph", () => {
  it("renders a decorative moon", () => {
    const { container } = render(<MoonGlyph illumination={0.1} waxing />);
    expect(container.querySelector(".moon-glyph")).toBeInTheDocument();
  });
});
