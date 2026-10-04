import { describe, expect, it } from "vitest";
import {
  analyseLunarStarts,
  buildTithiGraph,
  englishAxisTicks,
  lastStartSummary,
  mapPeriodTithis,
  outlookLine,
  patternSummary,
  tithiGraphConclusion,
  tithiGraphNote,
  tithiPolylines,
} from "./lunar-period";

describe("analyseLunarStarts", () => {
  it("reads a start the day after Amavasya as early Shukla paksha", () => {
    const pattern = analyseLunarStarts([
      { id: "1", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);

    expect(pattern.last?.day.tithiName).toBe("Pratipada");
    expect(pattern.last?.day.paksha).toBe("shukla");
    expect(pattern.last?.near).toBe("amavasya");
    expect(pattern.summary).toMatch(/Amavasya/);
    expect(pattern.summary).toMatch(/One start cannot show a moon pattern/);
    expect(lastStartSummary(pattern.last!)).toMatch(/12 Sept 2026/);
  });

  it("notices when several starts sit near the new moon", () => {
    const pattern = analyseLunarStarts([
      { id: "1", startDate: "2026-01-18", endDate: "2026-01-20" },
      { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
      { id: "3", startDate: "2026-10-10", endDate: "2026-10-12" },
    ]);

    expect(pattern.nearAmavasya).toBe(3);
    expect(patternSummary(pattern.starts)).toMatch(/3 of 3 logged starts were near Amavasya/);
    expect(patternSummary(pattern.starts)).toMatch(/not a medical finding/);
  });

  it("says when starts do not share a moon side", () => {
    const pattern = analyseLunarStarts([
      { id: "1", startDate: "2026-01-03", endDate: "2026-01-05" },
      { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
    ]);

    expect(pattern.summary).toMatch(/no clear moon pattern yet/);
  });
});

describe("mapPeriodTithis", () => {
  it("maps both the start day and the end day", () => {
    const rows = mapPeriodTithis([
      { id: "1", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].start.day.tithiName).toBe("Pratipada");
    expect(rows[0].start.near).toBe("amavasya");
    expect(rows[0].days).toBe(3);
    expect(rows[0].end.date).toBe("2026-09-14");
  });
});

describe("outlookLine", () => {
  it("compares the next moon day with the next estimated period", () => {
    expect(outlookLine("2026-01-10", "2026-01-29")).toMatch(/Next Amavasya 18 Jan 2026/);
    expect(outlookLine("2026-01-10", "2026-01-29")).toMatch(/date comparison only/);
    expect(outlookLine("2026-01-10", "2026-01-29")).not.toMatch(/prediction of bleeding/);
    expect(outlookLine("2026-01-10", "2026-10-10")).not.toMatch(/days before|days after|same day/);
  });
});

describe("buildTithiGraph", () => {
  it("returns nothing when there are no dates to plot", () => {
    expect(buildTithiGraph([])).toBeNull();
  });

  it("places English dates against tithi so a start after Amavasya sits low on the month", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);

    expect(graph?.from).toBe("2026-09-02");
    expect(graph?.to).toBe("2026-09-24");
    expect(graph?.marks[0]).toMatchObject({
      date: "2026-09-12",
      kind: "start",
      tithiName: "Pratipada",
      tithi: 1,
    });
    expect(graph?.days.find((day) => day.date === "2026-09-11")?.tithi).toBe(30);
    expect(graph?.days.filter((day) => day.bleeding).map((day) => day.date)).toEqual([
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
    ]);
  });

  it("keeps several new-moon starts at the top of the tithi scale", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-01-18", endDate: "2026-01-20" },
      { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
      { id: "3", startDate: "2026-10-10", endDate: "2026-10-12" },
    ]);

    const starts = graph?.marks.filter((mark) => mark.kind === "start") ?? [];
    expect(starts.map((mark) => mark.tithi)).toEqual([30, 30, 30]);
    expect(starts.map((mark) => mark.tithiName)).toEqual(["Amavasya", "Amavasya", "Amavasya"]);
  });
});

describe("tithiPolylines", () => {
  it("breaks the curve when the lunar month resets", () => {
    const lines = tithiPolylines([
      { date: "2026-09-11", tithi: 30, paksha: "krishna", bleeding: false },
      { date: "2026-09-12", tithi: 1, paksha: "shukla", bleeding: true },
      { date: "2026-09-13", tithi: 2, paksha: "shukla", bleeding: true },
    ]);

    expect(lines).toHaveLength(2);
    expect(lines[0][0].tithi).toBe(30);
    expect(lines[1][0].tithi).toBe(1);
  });
});

describe("tithiGraphNote", () => {
  it("explains a single start in plain words", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);
    expect(graph).not.toBeNull();
    expect(tithiGraphNote(graph!)).toMatch(/dot is the start day of bleeding/);
    expect(tithiGraphNote(graph!)).toMatch(/Pratipada/);
    expect(tithiGraphNote(graph!)).toMatch(/not a diagnosis/);
  });

  it("tells several starts to compare height, not a diagnosis", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-01-18", endDate: "2026-01-20" },
      { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
    ]);
    expect(graph).not.toBeNull();
    expect(tithiGraphNote(graph!)).toMatch(/The line joins each start day/);
    expect(tithiGraphNote(graph!)).toMatch(/stays level/);
    expect(tithiGraphNote(graph!)).toMatch(/not a diagnosis/);
  });
});

describe("tithiGraphConclusion", () => {
  it("asks for more starts before naming a pattern", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);
    expect(tithiGraphConclusion(graph!)).toMatch(/One start cannot show a pattern yet/);
    expect(tithiGraphConclusion(graph!)).toMatch(/not a diagnosis/);
  });

  it("reads several new-moon starts as a high line", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-01-18", endDate: "2026-01-20" },
      { id: "2", startDate: "2026-09-11", endDate: "2026-09-13" },
      { id: "3", startDate: "2026-10-10", endDate: "2026-10-12" },
    ]);
    expect(tithiGraphConclusion(graph!)).toMatch(/close to the new moon/);
    expect(tithiGraphConclusion(graph!)).toMatch(/not a diagnosis/);
  });

  it("reads a line that moves toward the new moon", () => {
    const graph = buildTithiGraph([
      { id: "1", startDate: "2026-06-28", endDate: "2026-07-01" },
      { id: "2", startDate: "2026-07-22", endDate: "2026-07-25" },
      { id: "3", startDate: "2026-08-18", endDate: "2026-08-21" },
      { id: "4", startDate: "2026-09-12", endDate: "2026-09-14" },
    ]);
    expect(tithiGraphConclusion(graph!)).toMatch(/moving toward the new moon/);
    expect(tithiGraphConclusion(graph!)).toMatch(/not a diagnosis/);
  });
});

describe("englishAxisTicks", () => {
  it("uses English month starts on a long range", () => {
    const ticks = englishAxisTicks("2026-01-08", "2026-04-20");
    expect(ticks[0]).toBe("2026-01-08");
    expect(ticks).toContain("2026-02-01");
    expect(ticks).toContain("2026-03-01");
    expect(ticks).toContain("2026-04-01");
  });
});
