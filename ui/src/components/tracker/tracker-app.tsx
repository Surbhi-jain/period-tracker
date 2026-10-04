"use client";

import { useState } from "react";
import { CycleCalendar } from "@/components/cycle-calendar";
import { CycleEstimateCard } from "@/components/cycle-estimate-card";
import { LockIcon } from "@/components/icons";
import { useTracker } from "@/hooks/use-tracker";
import { estimateCycle, type PeriodEntry } from "@/lib/cycle-estimate";
import { formatDate, formatWeekdayDate, todayLocal } from "@/lib/dates";
import { DataControls } from "./data-controls";
import { PeriodForm } from "./period-form";
import { PeriodHistory } from "./period-history";

function StorageNote({ storage }: { storage: "device" | "account" | null }) {
  if (!storage) return null;
  return (
    <p className="storage-note">
      <LockIcon />
      {storage === "account" ? "Saved to your account" : "Saved only in this browser"}
    </p>
  );
}

export function pageTitle(estimate: ReturnType<typeof estimateCycle>) {
  if (!estimate.hasPeriod) return "Your tracker";
  if (estimate.isOnPeriod) return "Bleeding is in progress";
  if (estimate.daysUntil === null) return "Your tracker";
  if (estimate.daysUntil === 0) return "Next period around today";
  return `Next period in ${estimate.daysUntil} days`;
}

export function TrackerApp() {
  const tracker = useTracker();
  const { state, storage } = tracker;
  const [editing, setEditing] = useState<PeriodEntry | null>(null);
  const [skippedFirst, setSkippedFirst] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCycleExtras, setShowCycleExtras] = useState(false);
  const today = todayLocal();

  function startEdit(entry: PeriodEntry) {
    setEditing(entry);
    document.getElementById("period-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (state.phase === "loading") {
    return (
      <div className="tracker-status" role="status">
        <span className="spinner" aria-hidden="true" />
        Loading your private tracker…
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

  const { periods, movedFromDevice } = state;
  const estimate = estimateCycle(periods, today);
  const needsFirstPeriod = periods.length === 0 && !skippedFirst;

  if (needsFirstPeriod) {
    return (
      <div className="onboarding is-focus">
        <p className="eyebrow">
          <span /> Welcome to Luna
        </p>
        <PeriodForm
          entries={periods}
          today={today}
          editing={null}
          headingAs="h1"
          heading="When did bleeding last start?"
          copy="Pick the start day and end day. That is enough to see what is coming."
          showIcon
          onSave={async (range, editingId) => {
            await tracker.savePeriod(range, editingId);
            setShowWelcome(true);
          }}
          onCancelEdit={() => {}}
        />
        <StorageNote storage={storage} />
        <button
          className="text-button onboarding-skip"
          type="button"
          onClick={() => setSkippedFirst(true)}
        >
          I’ll log it later
        </button>
      </div>
    );
  }

  if (showWelcome && estimate.hasPeriod) {
    return (
      <section className="welcome-moment" aria-labelledby="welcome-title">
        <p className="step-label">YOU’RE IN</p>
        <h1 id="welcome-title">Your calendar is ready</h1>
        <p>
          {estimate.estimatedNextStart
            ? `Next period around ${formatDate(estimate.estimatedNextStart)}${
                estimate.shiftDays ? `, may shift ±${estimate.shiftDays} days` : ""
              }.`
            : "Luna will estimate your next period from what you just logged."}
        </p>
        <button className="primary-button" type="button" onClick={() => setShowWelcome(false)}>
          See my tracker
        </button>
      </section>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <div className="profile-bar">
          <div>
            <p>{formatWeekdayDate(today)}</p>
            <h1>{pageTitle(estimate)}</h1>
          </div>
          <div className="profile-bar-actions">
            <StorageNote storage={storage} />
          </div>
        </div>
        {movedFromDevice ? (
          <p className="form-message success" role="status">
            Dates from this browser were saved to your Google account. Open
            Luna on another phone with the same Google sign-in to see them.
          </p>
        ) : null}
      </div>

      <div className="dashboard-estimate">
        <CycleEstimateCard entries={periods} today={today} />
      </div>

      <div className="dashboard-log">
        <PeriodForm
          key={editing?.id ?? "new"}
          entries={periods}
          today={today}
          editing={editing}
          stepLabel={editing ? "UPDATE" : "LOG"}
          onSave={async (range, editingId) => {
            await tracker.savePeriod(range, editingId);
            setEditing(null);
          }}
          onCancelEdit={() => setEditing(null)}
        />
      </div>

      <div className="dashboard-calendar">
        {periods.length > 0 ? (
          <CycleCalendar
            entries={periods}
            today={today}
            showExtras={showCycleExtras}
            onShowExtras={() => setShowCycleExtras(true)}
            onHideExtras={() => setShowCycleExtras(false)}
            onEditPeriod={startEdit}
          />
        ) : (
          <div className="empty-state dashboard-empty">
            <h3>Your calendar will live here</h3>
            <p>Log a period under Record your period. History and predictions appear after the first save.</p>
          </div>
        )}
      </div>

      {periods.length > 0 ? (
        <div className="dashboard-history">
          <div className="card history-card">
            <PeriodHistory
              entries={periods}
              editingId={editing?.id ?? null}
              onEdit={startEdit}
              onDelete={async (id) => {
                await tracker.deletePeriod(id);
                if (editing?.id === id) setEditing(null);
              }}
            />
          </div>
        </div>
      ) : null}

      {storage ? (
        <div className="dashboard-data">
          <DataControls
            storage={storage}
            today={today}
            onExport={tracker.exportData}
            onDeleteAll={async () => {
              await tracker.deleteAll();
              setSkippedFirst(false);
              setShowWelcome(false);
              setShowCycleExtras(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
