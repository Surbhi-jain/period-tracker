const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Tone = "period" | "predicted" | "fertile" | "ovulation" | "pms" | "";

type Cell = { day: number; outside?: boolean; today?: boolean; tone: Tone; shift?: boolean };

// October 2026, Sunday-first. Same rules as the tracker: next start 14 Oct,
// ovulation 14 days earlier, fertile is the six days ending that day, PMS is
// the five days before the start, predicted bleed is five days, shift ±4.
const CELLS: Cell[] = [
  { day: 27, outside: true, tone: "fertile" },
  { day: 28, outside: true, tone: "fertile" },
  { day: 29, outside: true, tone: "fertile" },
  { day: 30, outside: true, tone: "ovulation" },
  { day: 1, tone: "" },
  { day: 2, tone: "" },
  { day: 3, tone: "" },
  { day: 4, tone: "" },
  { day: 5, today: true, tone: "" },
  { day: 6, tone: "" },
  { day: 7, tone: "" },
  { day: 8, tone: "" },
  { day: 9, tone: "pms" },
  { day: 10, tone: "pms", shift: true },
  { day: 11, tone: "pms", shift: true },
  { day: 12, tone: "pms", shift: true },
  { day: 13, tone: "pms", shift: true },
  { day: 14, tone: "predicted", shift: true },
  { day: 15, tone: "predicted", shift: true },
  { day: 16, tone: "predicted", shift: true },
  { day: 17, tone: "predicted", shift: true },
  { day: 18, tone: "predicted", shift: true },
  { day: 19, tone: "" },
  { day: 20, tone: "" },
  { day: 21, tone: "" },
  { day: 22, tone: "" },
  { day: 23, tone: "" },
  { day: 24, tone: "" },
  { day: 25, tone: "" },
  { day: 26, tone: "" },
  { day: 27, tone: "" },
  { day: 28, tone: "" },
  { day: 29, tone: "" },
  { day: 30, tone: "" },
  { day: 31, tone: "" },
];

function previewEdge(index: number) {
  const tone = CELLS[index].tone;
  if (!tone) return "";
  if (tone === "ovulation") return "is-single";
  const column = index % 7;
  const before = column > 0 && CELLS[index - 1].tone === tone;
  const after = column < 6 && CELLS[index + 1].tone === tone;
  if (before && after) return "is-mid";
  if (before) return "is-end";
  if (after) return "is-start";
  return "is-single";
}

export function MarketingCalendar({
  compact = false,
  showCaption = true,
}: {
  compact?: boolean;
  showCaption?: boolean;
}) {
  return (
    <div className={`preview-card${compact ? " is-compact" : ""}`}>
      {showCaption ? (
        <>
          <p className="preview-label">NEXT PERIOD</p>
          <p className="preview-big">in 9 days</p>
          <p className="preview-sub">around 14 Oct · may shift ±4 days</p>
        </>
      ) : (
        <p className="preview-month">October 2026</p>
      )}
      <div className="preview-grid" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span className="preview-weekday" key={weekday}>
            {weekday}
          </span>
        ))}
        {CELLS.map((cell, index) => (
          <span
            key={`${cell.day}-${index}`}
            className={[
              "preview-day",
              cell.tone,
              previewEdge(index),
              cell.outside ? "is-outside" : "",
              cell.today ? "is-today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="preview-num">{cell.day}</span>
          </span>
        ))}
      </div>
      <div className="preview-legend">
        <span><i className="dot period" /> Period</span>
        <span><i className="dot fertile" /> Fertile</span>
        <span><i className="dot ovulation" /> Ovulation</span>
        <span><i className="dot pms" /> PMS</span>
      </div>
    </div>
  );
}
