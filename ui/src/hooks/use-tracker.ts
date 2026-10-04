"use client";

import { apiFetch, useSession } from "@/lib/auth-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PeriodEntry } from "@/lib/cycle-estimate";
import { lunaDebug } from "@/lib/debug";
import {
  createAccountStore,
  createDeviceStore,
  StoreError,
  type PeriodRange,
  type TrackerStore,
} from "@/lib/tracker-store";

export type TrackerState =
  | { phase: "loading" }
  | { phase: "error"; error: string }
  | { phase: "ready"; periods: PeriodEntry[]; movedFromDevice?: boolean };

export function errorMessage(error: unknown) {
  return error instanceof StoreError ? error.message : "Something went wrong. Please try again.";
}

type ReadyState = Extract<TrackerState, { phase: "ready" }>;
type Loaded = { key: string; state: Exclude<TrackerState, { phase: "loading" }> };

export function useTracker() {
  const { status } = useSession();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);

  const store = useMemo<TrackerStore | null>(() => {
    if (typeof window === "undefined" || status === "loading") return null;
    return status === "authenticated"
      ? createAccountStore(apiFetch, window.localStorage)
      : createDeviceStore(window.localStorage);
  }, [status]);

  const loadKey = store ? `${store.kind}:${attempt}` : null;

  useEffect(() => {
    if (!store || !loadKey) return;
    let cancelled = false;
    lunaDebug("tracker", "Loading", { kind: store.kind });

    store
      .load()
      .then((data) => {
        if (!cancelled) setLoaded({ key: loadKey, state: { phase: "ready", ...data } });
      })
      .catch((error: unknown) => {
        lunaDebug("tracker", "Load failed", error);
        if (!cancelled) {
          setLoaded({ key: loadKey, state: { phase: "error", error: errorMessage(error) } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [store, loadKey]);

  const state: TrackerState =
    loaded && loaded.key === loadKey ? loaded.state : { phase: "loading" };

  const update = useCallback(
    (change: (current: ReadyState) => Partial<Omit<ReadyState, "phase">>) =>
      setLoaded((current) =>
        current && current.state.phase === "ready"
          ? { ...current, state: { ...current.state, ...change(current.state) } }
          : current,
      ),
    [],
  );

  const requireStore = useCallback(() => {
    if (!store) throw new StoreError("Still loading. Please try again in a moment.");
    return store;
  }, [store]);

  const savePeriod = useCallback(
    async (range: PeriodRange, editingId: string | null) => {
      const active = requireStore();
      if (editingId) {
        const saved = await active.updatePeriod(editingId, range);
        update((current) => ({
          periods: current.periods.map((entry) => (entry.id === editingId ? saved : entry)),
        }));
      } else {
        const saved = await active.createPeriod(range);
        update((current) => ({ periods: [saved, ...current.periods] }));
      }
    },
    [requireStore, update],
  );

  const deletePeriod = useCallback(
    async (id: string) => {
      await requireStore().deletePeriod(id);
      update((current) => ({ periods: current.periods.filter((entry) => entry.id !== id) }));
    },
    [requireStore, update],
  );

  const exportData = useCallback(() => requireStore().exportData(), [requireStore]);

  const deleteAll = useCallback(async () => {
    await requireStore().deleteAll();
    update(() => ({ periods: [] }));
  }, [requireStore, update]);

  return {
    state,
    storage: store?.kind ?? null,
    retry: () => setAttempt((value) => value + 1),
    savePeriod,
    deletePeriod,
    exportData,
    deleteAll,
  };
}
