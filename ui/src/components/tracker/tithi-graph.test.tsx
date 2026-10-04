import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TithiGraph } from "./tithi-graph";

describe("TithiGraph", () => {
  it("draws a start-date line and does not write a key below", () => {
    const { container } = render(
      <TithiGraph
        entries={[
          { id: "1", startDate: "2026-01-18", endDate: "2026-01-20" },
          { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "When bleeding sat in the lunar month" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Line graph of each start day/ })).toBeInTheDocument();
    expect(container.querySelector(".tithi-graph-starts")).toHaveAttribute("points");
    expect(container.querySelectorAll(".tithi-graph-start")).toHaveLength(2);
    expect(screen.getByText("New moon")).toBeInTheDocument();
    expect(screen.getByText("Full moon")).toBeInTheDocument();
    expect(screen.getByText("Next new moon")).toBeInTheDocument();
    expect(screen.getByText("Your dates")).toBeInTheDocument();
    expect(screen.queryByText("Started on")).toBeNull();
    expect(screen.queryByText("Bleeding started")).toBeNull();
    expect(screen.queryByText("Days you bled")).toBeNull();
    expect(screen.getByText(/The line joins each start day/)).toBeInTheDocument();
    expect(screen.getByText(/what the line shows/i)).toBeInTheDocument();
    expect(screen.getByText(/start days sat close to the new moon/)).toBeInTheDocument();
    expect(screen.getAllByText(/not a diagnosis/).length).toBeGreaterThan(0);
  });

  it("does not render when there are no periods", () => {
    const { container } = render(<TithiGraph entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
