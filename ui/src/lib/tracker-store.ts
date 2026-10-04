import type { PeriodEntry } from "./cycle-estimate";
import { lunaDebug } from "./debug";
import { periodOverlaps, validatePeriodInput } from "./validation";

export const PROFILE_KEY = "luna-profile-v1";
export const PERIODS_KEY = "luna-periods-v1";

export type TrackerData = {
  periods: PeriodEntry[];
  movedFromDevice?: boolean;
};

export type PeriodRange = { startDate: string; endDate: string };

export type DataExport = TrackerData & {
  exportedAt: string;
  account: string | null;
};

export type TrackerStore = {
  kind: "device" | "account";
  load(): Promise<TrackerData>;
  createPeriod(range: PeriodRange): Promise<PeriodEntry>;
  updatePeriod(id: string, range: PeriodRange): Promise<PeriodEntry>;
  deletePeriod(id: string): Promise<void>;
  exportData(): Promise<DataExport>;
  deleteAll(): Promise<void>;
};

export class StoreError extends Error {}

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function readJson(storage: KeyValueStorage, key: string): unknown {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function dropLeftoverAge(storage: KeyValueStorage) {
  storage.removeItem(PROFILE_KEY);
}

export function readDeviceData(storage: KeyValueStorage): TrackerData {
  dropLeftoverAge(storage);
  const rawPeriods = readJson(storage, PERIODS_KEY);
  const periods = Array.isArray(rawPeriods)
    ? rawPeriods.filter(
        (entry): entry is PeriodEntry =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          validatePeriodInput(entry.startDate, entry.endDate) === null,
      )
    : [];

  return { periods };
}

function clearDeviceData(storage: KeyValueStorage) {
  dropLeftoverAge(storage);
  storage.removeItem(PERIODS_KEY);
}

export function createDeviceStore(
  storage: KeyValueStorage,
  newId: () => string = () => crypto.randomUUID(),
): TrackerStore {
  const writePeriods = (periods: PeriodEntry[]) =>
    storage.setItem(PERIODS_KEY, JSON.stringify(periods));

  return {
    kind: "device",
    async load() {
      return readDeviceData(storage);
    },
    async createPeriod(range) {
      const entry: PeriodEntry = { id: newId(), ...range };
      writePeriods([entry, ...readDeviceData(storage).periods]);
      return entry;
    },
    async updatePeriod(id, range) {
      const periods = readDeviceData(storage).periods;
      if (!periods.some((entry) => entry.id === id)) {
        throw new StoreError("Entry not found.");
      }
      const updated: PeriodEntry = { id, ...range };
      writePeriods(periods.map((entry) => (entry.id === id ? updated : entry)));
      return updated;
    },
    async deletePeriod(id) {
      writePeriods(readDeviceData(storage).periods.filter((entry) => entry.id !== id));
    },
    async exportData() {
      return {
        exportedAt: new Date().toISOString(),
        account: null,
        ...readDeviceData(storage),
      };
    },
    async deleteAll() {
      clearDeviceData(storage);
    },
  };
}

export type StoreFetcher = (url: string, init?: RequestInit) => Promise<Response>;

async function request<T>(
  fetcher: StoreFetcher,
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new StoreError("You seem to be offline. Please check your connection.");
  }

  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    lunaDebug("store", `${init?.method ?? "GET"} ${url} failed`, body.error);
    throw new StoreError(body.error ?? "Something went wrong. Please try again.");
  }
  return body;
}

export function createAccountStore(
  fetcher: StoreFetcher,
  deviceStorage: KeyValueStorage,
): TrackerStore {
  return {
    kind: "account",
    async load() {
      const { periods } = await request<{ periods: PeriodEntry[] }>(fetcher, "/periods");
      const device = readDeviceData(deviceStorage);
      if (device.periods.length === 0) return { periods };

      let nextPeriods = periods;
      for (const entry of device.periods) {
        if (periodOverlaps(entry.startDate, entry.endDate, nextPeriods)) continue;
        const { period } = await request<{ period: PeriodEntry }>(
          fetcher,
          "/periods",
          {
            method: "POST",
            body: JSON.stringify({ startDate: entry.startDate, endDate: entry.endDate }),
          },
        );
        nextPeriods = [period, ...nextPeriods];
      }

      lunaDebug("store", "Moved this device's data into the account");
      clearDeviceData(deviceStorage);
      return { periods: nextPeriods, movedFromDevice: true };
    },
    async createPeriod(range) {
      return (
        await request<{ period: PeriodEntry }>(fetcher, "/periods", {
          method: "POST",
          body: JSON.stringify(range),
        })
      ).period;
    },
    async updatePeriod(id, range) {
      return (
        await request<{ period: PeriodEntry }>(
          fetcher,
          `/periods/${encodeURIComponent(id)}`,
          { method: "PUT", body: JSON.stringify(range) },
        )
      ).period;
    },
    async deletePeriod(id) {
      await request(fetcher, `/periods/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    async exportData() {
      return request<DataExport>(fetcher, "/account");
    },
    async deleteAll() {
      await request(fetcher, "/account", { method: "DELETE" });
      clearDeviceData(deviceStorage);
    },
  };
}
