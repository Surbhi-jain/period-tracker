import type { PeriodEntry } from "@/lib/cycle-estimate";
import { startToStartDays, toUtcDate } from "@/lib/dates";
import {
  buildTithiGraph,
  englishAxisTicks,
  tithiGraphConclusion,
  tithiGraphNote,
  type TithiGraphMark,
} from "@/lib/lunar-period";

const WIDTH = 860;
const HEIGHT = 300;
const LEFT = 118;
const RIGHT = 36;
const TOP = 28;
const BOTTOM = 48;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

const Y_TICKS = [
  { phase: 0, label: "New moon" },
  { phase: 15, label: "Full moon" },
  { phase: 30, label: "Next new moon" },
];

function phaseFromNewMoon(tithi: number) {
  return tithi === 30 ? 0 : tithi;
}

function formatTick(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

function xFor(date: string, from: string, span: number) {
  if (span <= 0) return LEFT;
  return LEFT + (startToStartDays(from, date) / span) * PLOT_WIDTH;
}

function yForPhase(phase: number) {
  return TOP + (phase / 30) * PLOT_HEIGHT;
}

function yFor(tithi: number) {
  return yForPhase(phaseFromNewMoon(tithi));
}

function markColor(mark: TithiGraphMark) {
  return mark.paksha === "shukla" ? "var(--wine)" : "var(--lavender)";
}

export function TithiGraph({ entries }: { entries: PeriodEntry[] }) {
  const model = buildTithiGraph(entries);
  if (!model) return null;

  const { from, to, span, marks } = model;
  const starts = marks
    .filter((mark) => mark.kind === "start")
    .sort((a, b) => a.date.localeCompare(b.date));
  const ticks = englishAxisTicks(from, to);
  const startLine = starts
    .map((mark) => `${xFor(mark.date, from, span).toFixed(1)},${yFor(mark.tithi).toFixed(1)}`)
    .join(" ");

  return (
    <section className="card tithi-graph-card" aria-labelledby="tithi-graph">
      <p className="step-label">PATTERN</p>
      <h2 id="tithi-graph">When bleeding sat in the lunar month</h2>
      <p className="card-copy">{tithiGraphNote(model)}</p>
      <div className="tithi-graph-wrap">
        <svg
          className="tithi-graph"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Line graph of each start day of bleeding on the lunar month, plotted against your dates"
        >
          <rect
            className="tithi-graph-band"
            x={LEFT}
            y={yForPhase(12)}
            width={PLOT_WIDTH}
            height={yForPhase(18) - yForPhase(12)}
          />
          {Y_TICKS.map((tick) => {
            const y = yForPhase(tick.phase);
            return (
              <g key={tick.label}>
                <line className="tithi-graph-guide" x1={LEFT} y1={y} x2={WIDTH - RIGHT} y2={y} />
                <text className="tithi-graph-y" x={LEFT - 12} y={y + 4} textAnchor="end">
                  {tick.label}
                </text>
              </g>
            );
          })}
          <line className="tithi-graph-axis" x1={LEFT} y1={TOP} x2={LEFT} y2={TOP + PLOT_HEIGHT} />
          <line
            className="tithi-graph-axis"
            x1={LEFT}
            y1={TOP + PLOT_HEIGHT}
            x2={WIDTH - RIGHT}
            y2={TOP + PLOT_HEIGHT}
          />
          {starts.length > 1 ? (
            <polyline className="tithi-graph-starts" fill="none" points={startLine} />
          ) : null}
          {starts.map((mark) => {
            const x = xFor(mark.date, from, span);
            const y = yFor(mark.tithi);
            const labelBelow = y < TOP + PLOT_HEIGHT * 0.72;
            return (
              <g key={`start-${mark.date}`}>
                <circle className="tithi-graph-start" cx={x} cy={y} r="7" fill={markColor(mark)}>
                  <title>
                    Start day {formatTick(mark.date)}, {mark.tithiName}
                  </title>
                </circle>
                <text
                  className="tithi-graph-mark-label"
                  x={x}
                  y={labelBelow ? y + 20 : y - 12}
                  textAnchor="middle"
                >
                  {formatTick(mark.date)}
                </text>
              </g>
            );
          })}
          {ticks.map((date) => (
            <text
              key={date}
              className="tithi-graph-x"
              x={xFor(date, from, span)}
              y={HEIGHT - 22}
              textAnchor="middle"
            >
              {formatTick(date)}
            </text>
          ))}
          <text className="tithi-graph-axis-title" x={LEFT + PLOT_WIDTH / 2} y={HEIGHT - 4}>
            Your dates
          </text>
        </svg>
      </div>
      <div className="tithi-graph-finding">
        <p className="step-label">WHAT THE LINE SHOWS</p>
        <p>{tithiGraphConclusion(model)}</p>
      </div>
    </section>
  );
}
