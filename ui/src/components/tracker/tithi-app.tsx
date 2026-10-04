"use client";

import Link from "next/link";
import { PageBack, PageHero } from "@/components/page-hero";
import { useTracker } from "@/hooks/use-tracker";
import { estimateCycle } from "@/lib/cycle-estimate";
import { formatDate, todayLocal } from "@/lib/dates";
import {
  analyseLunarStarts,
  comingMoons,
  outlookLine,
} from "@/lib/lunar-period";
import { HEALTH_DISCLAIMER } from "@/lib/site";
import { MoonGlyph } from "./lunar-pattern";
import { TithiGraph } from "./tithi-graph";

export function TithiApp() {
  const tracker = useTracker();
  const { state } = tracker;
  const today = todayLocal();

  if (state.phase === "loading") {
    return (
      <div className="tracker-status" role="status">
        <span className="spinner" aria-hidden="true" />
        Loading your moon reading…
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <section className="card status-card" role="alert">
        <p className="step-label">SOMETHING WENT WRONG</p>
        <h2>We could not load your saved data</h2>
        <p className="card-copy">{state.error}</p>
        <button className="primary-button" type="button" onClick={tracker.retry}>
          Try again
        </button>
      </section>
    );
  }

  const { periods } = state;
  const estimate = estimateCycle(periods, today);
  const pattern = analyseLunarStarts(periods);
  const moons = comingMoons(today);
  const last = pattern.last;

  return (
    <div className="tithi-page">
      <PageBack href="/tracker">← Back to tracker</PageBack>
      <PageHero
        label="HINDU LUNAR CALENDAR"
        title="Moon and tithi"
        lead="Each start day is placed on its tithi. This is a date reading, not a diagnosis."
      />

      {periods.length === 0 ? (
        <section className="card">
          <h2>Log a period first</h2>
          <p className="card-copy">
            Once you save a start day and end day of bleeding, this page will
            map those dates to tithi.
          </p>
          <Link className="primary-button" href="/tracker">
            Open tracker
          </Link>
        </section>
      ) : (
        <>
          {last ? (
            <section className="card lunar-card" aria-labelledby="tithi-last">
              <p className="step-label">LAST START</p>
              <div className="lunar-hero">
                <MoonGlyph
                  illumination={last.day.illumination}
                  waxing={last.day.paksha === "shukla"}
                />
                <div>
                  <p className="lunar-date">{formatDate(last.date)}</p>
                  <h2 id="tithi-last">{last.day.tithiName}</h2>
                  <p className="lunar-paksha">
                    {last.day.pakshaLabel} · {last.day.phaseLabel}
                  </p>
                </div>
                <p className="lunar-stat">
                  <span>Starts logged</span>
                  <strong>{periods.length}</strong>
                </p>
              </div>
              <p className="card-copy">{pattern.summary}</p>
            </section>
          ) : null}

          <TithiGraph entries={periods} />

          <section className="card" aria-labelledby="tithi-analysis">
            <p className="step-label">ANALYSIS</p>
            <h2 id="tithi-analysis">What the starts show</h2>
            <div className="tithi-stats">
              <div>
                <span>Starts in Shukla paksha</span>
                <strong>{pattern.shuklaCount}</strong>
              </div>
              <div>
                <span>Starts in Krishna paksha</span>
                <strong>{pattern.krishnaCount}</strong>
              </div>
              <div>
                <span>Near Amavasya</span>
                <strong>{pattern.nearAmavasya}</strong>
              </div>
              <div>
                <span>Near Purnima</span>
                <strong>{pattern.nearPurnima}</strong>
              </div>
            </div>
            <p className="card-copy">{outlookLine(today, estimate.estimatedNextStart)}</p>
            {moons.amavasya || moons.purnima ? (
              <ul className="lunar-list">
                {moons.amavasya ? (
                  <li>
                    <strong>Next Amavasya</strong>
                    <span>{formatDate(moons.amavasya)}</span>
                  </li>
                ) : null}
                {moons.purnima ? (
                  <li>
                    <strong>Next Purnima</strong>
                    <span>{formatDate(moons.purnima)}</span>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </section>
        </>
      )}

      <p className="estimate-disclaimer">
        Tithi is counted from the sun and the moon at about sunrise in India.
        Luna does not name Hindu months, because those names change with the
        regional calendar. {HEALTH_DISCLAIMER}
      </p>
    </div>
  );
}
