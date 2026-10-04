import type { PeriodEntry } from "./cycle-estimate";
import { addDays, daysBetween, formatDate, startToStartDays } from "./dates";
import {
  daysFromPeak,
  hinduDay,
  nextPeakOnOrAfter,
  type HinduDay,
  type Paksha,
} from "./hindu-calendar";

export type LunarStart = {
  date: string;
  day: HinduDay;
  near: "amavasya" | "purnima" | null;
  nearOffset: number | null;
};

export type LunarPattern = {
  starts: LunarStart[];
  last: LunarStart | null;
  shuklaCount: number;
  krishnaCount: number;
  nearAmavasya: number;
  nearPurnima: number;
  summary: string;
};

export function describeNear(start: LunarStart) {
  if (start.day.peak === "amavasya") return "on Amavasya, the new moon";
  if (start.day.peak === "purnima") return "on Purnima, the full moon";
  if (start.near === "amavasya" && start.nearOffset !== null) {
    const days = Math.abs(start.nearOffset);
    const when = start.nearOffset < 0 ? "after" : "before";
    return `${days} ${days === 1 ? "day" : "days"} ${when} Amavasya`;
  }
  if (start.near === "purnima" && start.nearOffset !== null) {
    const days = Math.abs(start.nearOffset);
    const when = start.nearOffset < 0 ? "after" : "before";
    return `${days} ${days === 1 ? "day" : "days"} ${when} Purnima`;
  }
  return start.day.phaseLabel.toLowerCase();
}

export function lastStartSummary(start: LunarStart) {
  return `Bleeding last started on ${formatDate(start.date)}, ${start.day.tithiName} of ${start.day.pakshaLabel} (${describeNear(start)}).`;
}

export function patternSummary(starts: LunarStart[]) {
  if (starts.length === 0) return "Log a period to see where the start day sat in the Hindu lunar month.";
  if (starts.length === 1) {
    return `${lastStartSummary(starts[0])} One start cannot show a moon pattern yet.`;
  }

  const nearAmavasya = starts.filter((item) => item.near === "amavasya").length;
  const nearPurnima = starts.filter((item) => item.near === "purnima").length;
  const shukla = starts.filter((item) => item.day.paksha === "shukla").length;
  const krishna = starts.length - shukla;

  if (nearAmavasya >= 2 && nearAmavasya > nearPurnima) {
    return `${nearAmavasya} of ${starts.length} logged starts were near Amavasya (new moon). In some Hindu traditions this is when bleeding is said to follow the dark moon. This is a reading of your dates, not a medical finding.`;
  }
  if (nearPurnima >= 2 && nearPurnima > nearAmavasya) {
    return `${nearPurnima} of ${starts.length} logged starts were near Purnima (full moon). Some traditions link bleeding to the bright moon. This is a reading of your dates, not a medical finding.`;
  }
  if (shukla >= 2 && shukla > krishna + 1) {
    return `${shukla} of ${starts.length} starts fell in Shukla paksha, the waxing half of the moon.`;
  }
  if (krishna >= 2 && krishna > shukla + 1) {
    return `${krishna} of ${starts.length} starts fell in Krishna paksha, the waning half of the moon.`;
  }
  return `Your ${starts.length} logged starts are spread across the lunar month, so there is no clear moon pattern yet.`;
}

function annotate(date: string): LunarStart {
  const day = hinduDay(date);
  const amavasya = daysFromPeak(date, "amavasya");
  const purnima = daysFromPeak(date, "purnima");
  const nearest =
    amavasya && purnima
      ? amavasya.distance <= purnima.distance
        ? amavasya
        : purnima
      : (amavasya ?? purnima);
  const nearPeak =
    nearest && nearest.distance <= 2
      ? nearest === amavasya
        ? "amavasya"
        : "purnima"
      : null;

  return {
    date,
    day,
    near: nearPeak,
    nearOffset: nearPeak && nearest ? nearest.offset : null,
  };
}

export function analyseLunarStarts(entries: PeriodEntry[]): LunarPattern {
  const starts = [...entries]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((entry) => annotate(entry.startDate));
  const last = starts[starts.length - 1] ?? null;
  const shuklaCount = starts.filter((item) => item.day.paksha === "shukla").length;

  return {
    starts,
    last,
    shuklaCount,
    krishnaCount: starts.length - shuklaCount,
    nearAmavasya: starts.filter((item) => item.near === "amavasya").length,
    nearPurnima: starts.filter((item) => item.near === "purnima").length,
    summary: patternSummary(starts),
  };
}

export function pakshaCounts(paksha: Paksha[]) {
  return {
    shukla: paksha.filter((item) => item === "shukla").length,
    krishna: paksha.filter((item) => item === "krishna").length,
  };
}

export type MappedPeriod = {
  id: string;
  start: LunarStart;
  end: LunarStart;
  days: number;
};

export function mapPeriodTithis(entries: PeriodEntry[]): MappedPeriod[] {
  return [...entries]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((entry) => ({
      id: entry.id,
      start: annotate(entry.startDate),
      end: annotate(entry.endDate),
      days: daysBetween(entry.startDate, entry.endDate),
    }));
}

export function comingMoons(today: string) {
  return {
    amavasya: nextPeakOnOrAfter(today, "amavasya"),
    purnima: nextPeakOnOrAfter(today, "purnima"),
  };
}

export function outlookLine(today: string, nextPeriod: string | null) {
  const moons = comingMoons(today);
  const parts = [];
  if (moons.amavasya) parts.push(`Next Amavasya ${formatDate(moons.amavasya)}`);
  if (moons.purnima) parts.push(`Next Purnima ${formatDate(moons.purnima)}`);
  if (!nextPeriod || parts.length === 0) {
    return parts.length ? `${parts.join("; ")}.` : "";
  }
  const nearerMoon =
    moons.amavasya && moons.purnima
      ? Math.abs(startToStartDays(nextPeriod, moons.amavasya)) <=
        Math.abs(startToStartDays(nextPeriod, moons.purnima))
        ? { name: "Amavasya", date: moons.amavasya }
        : { name: "Purnima", date: moons.purnima }
      : moons.amavasya
        ? { name: "Amavasya", date: moons.amavasya }
        : moons.purnima
          ? { name: "Purnima", date: moons.purnima }
          : null;
  if (!nearerMoon) return `${parts.join("; ")}.`;
  const gap = startToStartDays(nextPeriod, nearerMoon.date);
  if (Math.abs(gap) > 40) return `${parts.join("; ")}.`;
  const when =
    gap === 0
      ? `falls on the same day as the next estimated period`
      : gap > 0
        ? `is ${gap} ${gap === 1 ? "day" : "days"} after the next estimated period`
        : `is ${-gap} ${-gap === 1 ? "day" : "days"} before the next estimated period`;
  return `${parts.join("; ")}. ${nearerMoon.name} ${when}. This is a date comparison only, not a prediction.`;
}

export const MAX_TITHI_GRAPH_DAYS = 400;

export type TithiGraphMark = {
  date: string;
  tithi: number;
  tithiName: string;
  paksha: Paksha;
  kind: "start" | "end";
};

export type TithiGraphDay = {
  date: string;
  tithi: number;
  paksha: Paksha;
  bleeding: boolean;
};

export type TithiGraphModel = {
  from: string;
  to: string;
  span: number;
  days: TithiGraphDay[];
  marks: TithiGraphMark[];
};

function bleedingDates(entries: PeriodEntry[]) {
  const dates = new Set<string>();
  for (const entry of entries) {
    const length = startToStartDays(entry.startDate, entry.endDate);
    for (let offset = 0; offset <= length; offset += 1) {
      dates.add(addDays(entry.startDate, offset));
    }
  }
  return dates;
}

export function buildTithiGraph(entries: PeriodEntry[]): TithiGraphModel | null {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const first = sorted[0].startDate;
  const last = sorted.reduce(
    (latest, entry) => (entry.endDate > latest ? entry.endDate : latest),
    sorted[0].endDate,
  );
  const loggedSpan = startToStartDays(first, last);
  const pad = loggedSpan <= 60 ? 10 : 3;
  const from = addDays(first, -pad);
  const to = addDays(last, pad);
  const span = startToStartDays(from, to);
  const bleeding = bleedingDates(sorted);

  const days: TithiGraphDay[] = [];
  if (span <= MAX_TITHI_GRAPH_DAYS) {
    for (let offset = 0; offset <= span; offset += 1) {
      const date = addDays(from, offset);
      const day = hinduDay(date);
      days.push({
        date,
        tithi: day.tithi,
        paksha: day.paksha,
        bleeding: bleeding.has(date),
      });
    }
  }

  const marks: TithiGraphMark[] = sorted.flatMap((entry) => {
    const start = hinduDay(entry.startDate);
    const end = hinduDay(entry.endDate);
    return [
      {
        date: entry.startDate,
        tithi: start.tithi,
        tithiName: start.tithiName,
        paksha: start.paksha,
        kind: "start" as const,
      },
      {
        date: entry.endDate,
        tithi: end.tithi,
        tithiName: end.tithiName,
        paksha: end.paksha,
        kind: "end" as const,
      },
    ];
  });

  return { from, to, span, days, marks };
}

export function tithiPolylines(days: TithiGraphDay[]) {
  const lines: TithiGraphDay[][] = [];
  let current: TithiGraphDay[] = [];
  for (const day of days) {
    if (current.length > 0 && day.tithi < current[current.length - 1].tithi) {
      lines.push(current);
      current = [];
    }
    current.push(day);
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export function bleedingPolylines(days: TithiGraphDay[]) {
  return tithiPolylines(days).flatMap((line) => {
    const parts: TithiGraphDay[][] = [];
    let current: TithiGraphDay[] = [];
    for (const day of line) {
      if (!day.bleeding) {
        if (current.length > 0) parts.push(current);
        current = [];
        continue;
      }
      current.push(day);
    }
    if (current.length > 0) parts.push(current);
    return parts;
  });
}

function nextMonthStart(isoDate: string) {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

export function englishAxisTicks(from: string, to: string) {
  const span = startToStartDays(from, to);
  if (span <= 0) return [from];
  if (span <= 45) {
    const step = span <= 21 ? 5 : 7;
    const ticks = [];
    for (let offset = 0; offset <= span; offset += step) ticks.push(addDays(from, offset));
    if (ticks[ticks.length - 1] !== to) ticks.push(to);
    return ticks;
  }

  const ticks = [from];
  let cursor = from.endsWith("-01") ? nextMonthStart(from) : `${from.slice(0, 8)}01`;
  if (cursor <= from) cursor = nextMonthStart(from);
  while (cursor <= to) {
    ticks.push(cursor);
    cursor = nextMonthStart(cursor);
  }
  if (ticks[ticks.length - 1] !== to && startToStartDays(ticks[ticks.length - 1], to) > 8) {
    ticks.push(to);
  }
  return ticks.length > 10 ? ticks.filter((_, index) => index % 2 === 0 || index === ticks.length - 1) : ticks;
}

export function lunarPhaseFromNewMoon(tithi: number) {
  return tithi === 30 ? 0 : tithi;
}

export function tithiGraphNote(model: TithiGraphModel) {
  const starts = model.marks.filter((mark) => mark.kind === "start");
  if (starts.length === 1) {
    return `The dot is the start day of bleeding. It sat on ${starts[0].tithiName}. Dots near the top sat close to the new moon. This is a date reading, not a diagnosis.`;
  }
  return "The line joins each start day of bleeding. Dots near the top sat close to the new moon. The middle band is the full moon. If the line stays level, your starts often fall on a similar moon day. This is a date reading, not a diagnosis.";
}

export function tithiGraphConclusion(model: TithiGraphModel) {
  const starts = model.marks
    .filter((mark) => mark.kind === "start")
    .sort((a, b) => a.date.localeCompare(b.date));
  const close = "This is a reading of your dates, not a diagnosis.";

  if (starts.length < 2) {
    return `One start cannot show a pattern yet. After a few more logged periods, the line can show whether starts sit near the same moon day. ${close}`;
  }

  const phases = starts.map((mark) => lunarPhaseFromNewMoon(mark.tithi));
  const first = starts[0];
  const last = starts[starts.length - 1];
  const firstPhase = phases[0];
  const lastPhase = phases[phases.length - 1];
  const spread = Math.max(...phases) - Math.min(...phases);
  const nearNew = phases.filter((phase) => phase <= 2 || phase >= 28).length;
  const nearFull = phases.filter((phase) => phase >= 13 && phase <= 17).length;
  const shukla = starts.filter((mark) => mark.paksha === "shukla").length;
  const towardNew = phases.every((phase, index) => index === 0 || phase <= phases[index - 1]);
  const towardFull = phases.every((phase, index) => index === 0 || phase >= phases[index - 1]);
  const majority = Math.ceil(starts.length / 2);

  if (nearNew >= 2 && nearNew > nearFull && nearNew >= majority) {
    return `${nearNew} of ${starts.length} start days sat close to the new moon, so the line stays high on the chart. ${close}`;
  }
  if (nearFull >= 2 && nearFull > nearNew && nearFull >= majority) {
    return `${nearFull} of ${starts.length} start days sat close to the full moon, so the line stays in the middle band. ${close}`;
  }
  if (spread <= 3) {
    return `The line stays nearly level. Your ${starts.length} start days fell on a similar moon day, around ${last.tithiName}. ${close}`;
  }
  if (starts.length >= 3 && towardNew && lastPhase < firstPhase && lastPhase <= 6) {
    return `The line is moving toward the new moon. Start days have shifted from ${first.tithiName} toward ${last.tithiName}. That is a date pattern, not a health finding. ${close}`;
  }
  if (starts.length >= 3 && towardFull && lastPhase > firstPhase && lastPhase >= 12) {
    return `The line is moving toward the full moon. Start days have shifted from ${first.tithiName} toward ${last.tithiName}. That is a date pattern, not a health finding. ${close}`;
  }
  if (shukla === starts.length) {
    return `Every logged start sat in the waxing half of the moon (Shukla paksha). The line stays on that side of the month. ${close}`;
  }
  if (shukla === 0) {
    return `Every logged start sat in the waning half of the moon (Krishna paksha). The line stays on that side of the month. ${close}`;
  }
  return `The line moves around the lunar month, so there is no clear moon-day pattern yet. Keep logging start days to see if one forms. ${close}`;
}
