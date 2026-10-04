"use client";

import { useMemo, useState } from "react";
import {
  buildCalendarMonth,
  periodOnDate,
  shiftMonth,
  type CalendarDay,
  type FlowLevel,
  type MonthHighlight,
} from "@/lib/calendar";
import type { PeriodEntry } from "@/lib/cycle-estimate";
import { formatDate, formatWeekdayDate, toUtcDate } from "@/lib/dates";

const WEEKDAYS = [
  { short: "S", full: "Sunday" },
  { short: "M", full: "Monday" },
  { short: "T", full: "Tuesday" },
  { short: "W", full: "Wednesday" },
  { short: "T", full: "Thursday" },
  { short: "F", full: "Friday" },
  { short: "S", full: "Saturday" },
] as const;

const FLOW_LABEL: Record<FlowLevel, string> = {
  light: "light flow",
  medium: "medium flow",
  heavy: "heavy flow",
};

const EXTRA_KINDS = new Set(["fertile", "ovulation", "pms"]);

export function describeDay(day: CalendarDay, extras = true) {
  const parts = [formatDate(day.date)];
  if (day.isToday) parts.push("today");
  if (day.flow) parts.push(`bleeding, ${FLOW_LABEL[day.flow]}`);
  if (day.isPredictedPeriod) parts.push("predicted period");
  if (day.isPredictedStart && day.shiftDays !== null) {
    parts.push(`may shift by ${day.shiftDays} days either way`);
  }
  if (extras) {
    if (day.isOvulation) parts.push("estimated ovulation");
    else if (day.isFertile) parts.push("fertile window");
    if (day.isPms) parts.push("PMS days");
  }
  return parts.join(", ");
}

export function dayDetail(day: CalendarDay, extras = true) {
  if (day.flow) {
    return {
      title: "Logged bleeding",
      note: `A recorded bleeding day (${FLOW_LABEL[day.flow]}).`,
    };
  }
  if (day.isPredictedStart && day.shiftDays !== null) {
    return {
      title: "Predicted period start",
      note: `Estimated from your logged cycles. It may arrive up to ${day.shiftDays} days earlier or later.`,
    };
  }
  if (day.isPredictedPeriod) {
    return {
      title: "Predicted period",
      note: "Estimated from the length of your last logged period. Future dates get less certain further ahead.",
    };
  }
  if (extras && day.isOvulation) {
    return {
      title: "Estimated ovulation",
      note: "About 14 days before the next period is due. This is an estimate, not a test result.",
    };
  }
  if (extras && day.isFertile) {
    return {
      title: "Fertile window",
      note: "The six days ending on estimated ovulation. Not a method of contraception.",
    };
  }
  if (extras && day.isPms) {
    return {
      title: "PMS days",
      note: "The few days just before the predicted period.",
    };
  }
  if (day.isToday) {
    return {
      title: `No period on ${formatDate(day.date)}`,
      note: "No bleeding or prediction on this day.",
    };
  }
  return {
    title: day.inMonth ? "No mark on this day" : "Outside this month",
    note: extras
      ? "Tap a coloured day to see what it means."
      : "Tap a coloured day to see what it means, or ask about fertile window, ovulation and PMS.",
  };
}

function dayTone(day: CalendarDay, extras: boolean) {
  if (day.flow) return `period-${day.flow}`;
  if (day.isPredictedPeriod) return "predicted";
  if (!extras) return "";
  if (day.isOvulation) return "ovulation";
  if (day.isFertile) return "fertile";
  if (day.isPms) return "pms";
  return "";
}

function rangeEdge(week: CalendarDay[], index: number, extras: boolean) {
  const tone = dayTone(week[index], extras);
  if (!tone) return "";
  const before = index > 0 && dayTone(week[index - 1], extras) === tone;
  const after = index < week.length - 1 && dayTone(week[index + 1], extras) === tone;
  if (before && after) return "is-mid";
  if (before) return "is-end";
  if (after) return "is-start";
  return "is-single";
}

function dayClassName(day: CalendarDay, selected: boolean, edge: string, extras: boolean) {
  const classes = ["calendar-day"];
  if (!day.inMonth) classes.push("is-outside");
  if (day.isToday) classes.push("is-today");
  if (selected) classes.push("is-selected");
  if (day.flow) classes.push("is-period", `flow-${day.flow}`);
  else if (day.isPredictedPeriod) classes.push("is-predicted");
  else if (extras && day.isOvulation) classes.push("is-ovulation");
  else if (extras && day.isFertile) classes.push("is-fertile");
  else if (extras && day.isPms) classes.push("is-pms");
  if (day.mayShift) classes.push("may-shift");
  if (edge) classes.push(edge);
  return classes.join(" ");
}

function detailTone(day: CalendarDay, extras: boolean) {
  if (day.flow) return "period";
  if (day.isPredictedPeriod) return "predicted";
  if (extras && day.isOvulation) return "ovulation";
  if (extras && day.isFertile) return "fertile";
  if (extras && day.isPms) return "pms";
  return "quiet";
}

function pickDay(weeks: CalendarDay[][], selected: string | null, today: string) {
  const days = weeks.flat();
  return (
    days.find((day) => day.date === selected) ??
    days.find((day) => day.date === today) ??
    days.find((day) => day.inMonth) ??
    days[0]
  );
}

export function CycleCalendar({
  entries,
  today,
  flowByDate,
  showExtras,
  onShowExtras,
  onHideExtras,
  onEditPeriod,
}: {
  entries: PeriodEntry[];
  today: string;
  flowByDate?: Record<string, FlowLevel>;
  showExtras?: boolean;
  onShowExtras?: () => void;
  onHideExtras?: () => void;
  onEditPeriod?: (entry: PeriodEntry) => void;
}) {
  const todayDate = toUtcDate(today);
  const [view, setView] = useState({
    year: todayDate.getUTCFullYear(),
    month: todayDate.getUTCMonth(),
  });
  const [selected, setSelected] = useState<string | null>(today);
  const [internalExtras, setInternalExtras] = useState(false);
  const extras = showExtras ?? internalExtras;

  const calendar = useMemo(
    () => buildCalendarMonth(view.year, view.month, entries, today, flowByDate),
    [view, entries, today, flowByDate],
  );

  const isCurrentMonth =
    view.year === todayDate.getUTCFullYear() &&
    view.month === todayDate.getUTCMonth();
  const selectedDay = pickDay(calendar.weeks, selected, today);
  const detail = dayDetail(selectedDay, extras);
  const loggedPeriod = periodOnDate(entries, selectedDay.date);
  const hasVariedFlow = calendar.weeks
    .flat()
    .some((day) => day.flow === "light" || day.flow === "heavy");
  const hasLoggedPeriod = calendar.weeks.flat().some((day) => day.flow);
  const visibleHighlights = extras
    ? calendar.highlights
    : calendar.highlights.filter((item) => !EXTRA_KINDS.has(item.kind));
  const hasHiddenExtras =
    !extras && calendar.highlights.some((item) => EXTRA_KINDS.has(item.kind));

  function goTo(year: number, month: number) {
    setView({ year, month });
  }

  function revealExtras() {
    onShowExtras?.();
    if (showExtras === undefined) setInternalExtras(true);
  }

  function hideExtras() {
    onHideExtras?.();
    if (showExtras === undefined) setInternalExtras(false);
  }

  return (
    <section className="card calendar-card" id="tracker-calendar" aria-labelledby="calendar-title">
      <div className="calendar-toolbar">
        <p className="step-label">YOUR CALENDAR</p>
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav"
            onClick={() => {
              const next = shiftMonth(view.year, view.month, -1);
              goTo(next.year, next.month);
            }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2 id="calendar-title">{calendar.label}</h2>
          <button
            type="button"
            className="calendar-nav"
            onClick={() => {
              const next = shiftMonth(view.year, view.month, 1);
              goTo(next.year, next.month);
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        {!isCurrentMonth ? (
          <button
            type="button"
            className="calendar-today"
            onClick={() => {
              goTo(todayDate.getUTCFullYear(), todayDate.getUTCMonth());
              setSelected(today);
            }}
          >
            Back to today
          </button>
        ) : null}
      </div>

      {visibleHighlights.length > 0 ? (
        <div className="calendar-highlights" aria-label="What this month holds">
          {visibleHighlights.map((highlight) => (
            <button
              type="button"
              key={`${highlight.kind}-${highlight.start}`}
              className={`calendar-chip is-${highlight.kind}`}
              onClick={() => setSelected(highlight.start)}
              aria-pressed={selectedDay.date === highlight.start}
            >
              {highlight.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="calendar-empty">
          Log a period and this calendar will mark the next one.
        </p>
      )}
      {hasHiddenExtras ? (
        <button
          type="button"
          className="estimate-more-toggle calendar-more"
          onClick={revealExtras}
        >
          About fertile window, ovulation and PMS
        </button>
      ) : extras ? (
        <button
          type="button"
          className="estimate-more-toggle calendar-more"
          onClick={hideExtras}
        >
          Hide fertile window, ovulation and PMS
        </button>
      ) : null}

      <div className="calendar-grid" role="grid" aria-labelledby="calendar-title">
        <div className="calendar-row" role="row">
          {WEEKDAYS.map((weekday, index) => (
            <div
              className="calendar-weekday"
              role="columnheader"
              key={`${weekday.full}-${index}`}
              aria-label={weekday.full}
            >
              {weekday.short}
            </div>
          ))}
        </div>
        {calendar.weeks.map((week) => (
          <div className="calendar-row" role="row" key={week[0].date}>
            {week.map((day, index) => (
              <button
                type="button"
                className={dayClassName(
                  day,
                  selectedDay.date === day.date,
                  rangeEdge(week, index, extras),
                  extras,
                )}
                role="gridcell"
                key={day.date}
                aria-label={describeDay(day, extras)}
                aria-pressed={selectedDay.date === day.date}
                onClick={() => setSelected(day.date)}
              >
                <span className="calendar-num">{day.dayOfMonth}</span>
                {day.isToday ? <i className="today-mark" aria-hidden="true" /> : null}
                {day.isPredictedStart && day.shiftDays !== null ? (
                  <small className="shift-badge" aria-hidden="true">±{day.shiftDays}</small>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={`calendar-detail is-${detailTone(selectedDay, extras)}`} aria-live="polite">
        <p className="calendar-detail-date">
          {formatWeekdayDate(selectedDay.date)}
          {selectedDay.isToday ? <span className="calendar-detail-today">Today</span> : null}
        </p>
        <strong>{detail.title}</strong>
        <p>{detail.note}</p>
        {loggedPeriod && onEditPeriod ? (
          <button
            type="button"
            className="text-button calendar-edit"
            onClick={() => onEditPeriod(loggedPeriod)}
            aria-label={`Change the period covering ${formatDate(selectedDay.date)}`}
          >
            Change this period
          </button>
        ) : null}
      </div>

      <ul className="calendar-legend">
        {hasVariedFlow ? (
          <>
            <li><span className="swatch flow-light" />Light flow</li>
            <li><span className="swatch flow-medium" />Medium flow</li>
            <li><span className="swatch flow-heavy" />Heavy flow</li>
          </>
        ) : hasLoggedPeriod ? (
          <li><span className="swatch flow-medium" />Logged bleeding</li>
        ) : null}
        <LegendItems highlights={visibleHighlights} extras={extras} />
      </ul>
    </section>
  );
}

function LegendItems({
  highlights,
  extras,
}: {
  highlights: MonthHighlight[];
  extras: boolean;
}) {
  const kinds = new Set(highlights.map((item) => item.kind));
  const items = [
    kinds.has("predicted") ? (["is-predicted", "Predicted period"] as const) : null,
    extras && kinds.has("fertile") ? (["is-fertile", "Fertile window"] as const) : null,
    extras && kinds.has("ovulation") ? (["is-ovulation", "Ovulation day"] as const) : null,
    extras && kinds.has("pms") ? (["is-pms", "PMS days"] as const) : null,
    kinds.has("predicted") ? (["may-shift", "May shift ±"] as const) : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return extras ? (
      <>
        <li><span className="swatch is-predicted" />Predicted period</li>
        <li><span className="swatch is-fertile" />Fertile window</li>
        <li><span className="swatch is-ovulation" />Ovulation day</li>
        <li><span className="swatch is-pms" />PMS days</li>
        <li><span className="swatch may-shift" />May shift ±</li>
      </>
    ) : (
      <>
        <li><span className="swatch is-predicted" />Predicted period</li>
        <li><span className="swatch may-shift" />May shift ±</li>
      </>
    );
  }

  return (
    <>
      {items.map(([swatch, label]) => (
        <li key={label}>
          <span className={`swatch ${swatch}`} />
          {label}
        </li>
      ))}
    </>
  );
}
