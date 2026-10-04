"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DownloadIcon, TrashIcon } from "@/components/icons";
import { errorMessage } from "@/hooks/use-tracker";
import type { DataExport } from "@/lib/tracker-store";

export function downloadJson(data: DataExport, today: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `luna-data-${today}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataControls({
  storage,
  today,
  onExport,
  onDeleteAll,
}: {
  storage: "device" | "account";
  today: string;
  onExport: () => Promise<DataExport>;
  onDeleteAll: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function exportData() {
    setError("");
    setBusy(true);
    try {
      downloadJson(await onExport(), today);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    setError("");
    setBusy(true);
    setConfirmDelete(false);
    try {
      await onDeleteAll();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <section className="card data-card" aria-labelledby="data-title">
      <p className="step-label">YOUR DATA</p>
      <h2 id="data-title">You are in control</h2>
      <p className="card-copy">
        {storage === "account"
          ? "Your records are saved to your Luna account, which you open with Google sign-in. Download a copy or delete everything at any time."
          : "Your records are saved only in this browser. Clearing site data will erase them. Sign in with Google to keep them safe across devices."}
      </p>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="data-actions">
        <button className="secondary-button" type="button" disabled={busy} onClick={exportData}>
          <DownloadIcon /> Download my data
        </button>
        <button
          className="danger-button"
          type="button"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <TrashIcon /> Delete all my data
        </button>
      </div>
      {confirmDelete ? (
        <ConfirmDialog
          title="Delete all your data?"
          message={
            storage === "account"
              ? "This removes every period you logged from your account. This cannot be undone."
              : "This removes every period you logged from this browser. This cannot be undone."
          }
          confirmLabel="Delete everything"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void deleteAll()}
        />
      ) : null}
    </section>
  );
}
