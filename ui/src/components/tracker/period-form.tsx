"use client";

import { type FormEvent, useState } from "react";
import { CalendarIcon } from "@/components/icons";
import { errorMessage } from "@/hooks/use-tracker";
import type { PeriodEntry } from "@/lib/cycle-estimate";
import { formatShortRange } from "@/lib/dates";
import type { PeriodRange } from "@/lib/tracker-store";
import { PERIOD_ERROR, periodOverlaps, validatePeriodInput } from "@/lib/validation";

type Message = { tone: "success" | "error"; text: string } | null;

export function PeriodForm({
  entries,
  today,
  editing,
  stepLabel,
  heading,
  copy,
  headingAs = "h2",
  showIcon = true,
  onSave,
  onCancelEdit,
}: {
  entries: PeriodEntry[];
  today: string;
  editing: PeriodEntry | null;
  stepLabel?: string;
  heading?: string;
  copy?: string;
  headingAs?: "h1" | "h2";
  showIcon?: boolean;
  onSave: (range: PeriodRange, editingId: string | null) => Promise<void>;
  onCancelEdit: () => void;
}) {
  const Title = headingAs;
  const [startDate, setStartDate] = useState(editing?.startDate ?? "");
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);

  async function save(range: PeriodRange) {
    setMessage(null);
    const problem =
      validatePeriodInput(range.startDate, range.endDate, { today }) ??
      (periodOverlaps(range.startDate, range.endDate, entries, editing?.id)
        ? PERIOD_ERROR.overlap
        : null);
    if (problem) {
      setMessage({ tone: "error", text: problem });
      return;
    }

    setSaving(true);
    try {
      await onSave(range, editing?.id ?? null);
      setStartDate("");
      setEndDate("");
      setMessage({ tone: "success", text: editing ? "Period updated." : "Period saved." });
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save({ startDate, endDate });
  }

  return (
    <section
      className={`card form-card period-card${editing ? " is-editing" : ""}`}
      aria-labelledby="period-title"
    >
      <div className="card-head">
        {showIcon ? (
          <div className="icon-box">
            <CalendarIcon />
          </div>
        ) : null}
        <div>
          {stepLabel ? <p className="step-label">{stepLabel}</p> : null}
          <Title id="period-title">
            {heading ?? (editing ? "Update this period" : "Record your period")}
          </Title>
        </div>
      </div>
      <p className="card-copy">
        {copy ??
          (editing
            ? `You are changing ${formatShortRange(editing.startDate, editing.endDate)}. Adjust the start day or end day of bleeding, then save.`
            : "Enter the start day and end day of bleeding.")}
      </p>

      <form onSubmit={submit} noValidate>
        <div className="date-grid">
          <label className="field">
            <span>Start day of bleeding</span>
            <span className="date-input">
              <CalendarIcon />
              <input
                type="date"
                max={today}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </span>
          </label>
          <label className="field">
            <span>End day of bleeding</span>
            <span className="date-input">
              <CalendarIcon />
              <input
                type="date"
                min={startDate || undefined}
                max={today}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </span>
          </label>
        </div>
        {message ? (
          <p
            className={`form-message ${message.tone}`}
            role={message.tone === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        ) : null}
        <div className="form-footer">
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Update period" : "Save period"}
            </button>
            {editing ? (
              <button className="text-button form-cancel" type="button" onClick={onCancelEdit}>
                Cancel update
              </button>
            ) : (
              <button
                className="secondary-button"
                type="button"
                disabled={saving}
                onClick={() => void save({ startDate: today, endDate: today })}
              >
                Bleeding started today
              </button>
            )}
          </div>
          {!editing ? (
            <p className="field-hint">
              If bleeding continues, update the end day later from the calendar or
              your latest periods.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
