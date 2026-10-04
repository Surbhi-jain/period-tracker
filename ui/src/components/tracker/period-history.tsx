"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CalendarIcon } from "@/components/icons";
import { errorMessage } from "@/hooks/use-tracker";
import type { PeriodEntry } from "@/lib/cycle-estimate";
import { daysBetween, formatDate, toUtcDate } from "@/lib/dates";

const MONTH = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });

export const HISTORY_LIST_LIMIT = 3;

export function latestHistoryEntries(entries: PeriodEntry[]) {
  return [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, HISTORY_LIST_LIMIT);
}

export function PeriodHistory({
  entries,
  editingId,
  onEdit,
  onDelete,
}: {
  entries: PeriodEntry[];
  editingId: string | null;
  onEdit: (entry: PeriodEntry) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [pending, setPending] = useState<PeriodEntry | null>(null);
  const sorted = useMemo(() => latestHistoryEntries(entries), [entries]);
  const hiddenCount = Math.max(0, entries.length - sorted.length);

  async function remove(entry: PeriodEntry) {
    setPending(null);
    setMessage(null);
    try {
      await onDelete(entry.id);
      setMessage({ tone: "success", text: "Entry removed." });
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
    }
  }

  return (
    <section className="history" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow-mini">YOUR HISTORY</p>
          <h2 id="history-title">Latest periods</h2>
        </div>
        {entries.length > 0 ? (
          <span className="count">
            {hiddenCount > 0
              ? `${sorted.length} of ${entries.length}`
              : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </span>
        ) : null}
      </div>

      {message ? (
        <p
          className={`form-message ${message.tone}`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CalendarIcon />
          </div>
          <h3>No periods recorded yet</h3>
          <p>Your saved periods will appear here.</p>
        </div>
      ) : (
        <>
          <ol className="entry-list">
            {sorted.map((entry, index) => {
              const days = daysBetween(entry.startDate, entry.endDate);
              const label = formatDate(entry.startDate);
              const latest = index === 0;
              return (
                <li
                  className={`entry${latest ? " is-latest" : ""}${editingId === entry.id ? " is-editing" : ""}`}
                  key={entry.id}
                >
                  <div className="entry-date" aria-hidden="true">
                    <span>{toUtcDate(entry.startDate).getUTCDate()}</span>
                    {MONTH.format(toUtcDate(entry.startDate))}
                  </div>
                  <div className="entry-detail">
                    {latest ? <p className="entry-chip">Latest</p> : null}
                    <strong>
                      {label} – {formatDate(entry.endDate)}
                    </strong>
                    <span>
                      {days} {days === 1 ? "day" : "days"} of bleeding
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => onEdit(entry)}
                      aria-label={`Update period from ${label}`}
                    >
                      Update
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPending(entry)}
                      aria-label={`Remove period from ${label}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {hiddenCount > 0 ? (
            <a className="history-more" href="#tracker-calendar">
              <CalendarIcon />
              <span>
                {hiddenCount} earlier {hiddenCount === 1 ? "period is" : "periods are"} on the
                calendar. Tap a logged day to change one.
              </span>
            </a>
          ) : (
            <p className="history-more is-note">
              These dates also sit on the calendar above. Tap a logged day to change one.
            </p>
          )}
        </>
      )}
      {pending ? (
        <ConfirmDialog
          title="Remove this period?"
          message={`Remove the period ${formatDate(pending.startDate)} – ${formatDate(pending.endDate)}? This cannot be undone.`}
          confirmLabel="Remove this period"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => void remove(pending)}
        />
      ) : null}
    </section>
  );
}
