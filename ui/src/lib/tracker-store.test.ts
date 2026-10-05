import { describe, expect, it, vi } from "vitest";
import {
  createAccountStore,
  createDeviceStore,
  PERIODS_KEY,
  PROFILE_KEY,
  readDeviceData,
  StoreError,
} from "./tracker-store";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    has: (key: string) => data.has(key),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("readDeviceData", () => {
  it("returns empty data when nothing is saved or it is corrupt", () => {
    expect(readDeviceData(memoryStorage())).toEqual({ periods: [] });
    expect(
      readDeviceData(memoryStorage({ [PROFILE_KEY]: "{oops", [PERIODS_KEY]: "nope" })),
    ).toEqual({ periods: [] });
  });

  it("drops leftover age and entries that are not valid periods", () => {
    const storage = memoryStorage({
      [PROFILE_KEY]: JSON.stringify({ mode: "age", age: 28 }),
      [PERIODS_KEY]: JSON.stringify([
        { id: "a", startDate: "2026-01-01", endDate: "2026-01-05" },
        { id: "b", startDate: "2026-01-09", endDate: "2026-01-01" },
        { startDate: "2026-02-01", endDate: "2026-02-03" },
        null,
      ]),
    });

    expect(readDeviceData(storage)).toEqual({
      periods: [{ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }],
    });
    expect(storage.has(PROFILE_KEY)).toBe(false);
  });
});

describe("device store", () => {
  it("creates, updates, deletes, exports and clears periods in the browser", async () => {
    const storage = memoryStorage({
      [PROFILE_KEY]: JSON.stringify({ mode: "age", age: 28 }),
    });
    const store = createDeviceStore(storage, () => "id-1");

    await store.createPeriod({ startDate: "2026-01-01", endDate: "2026-01-05" });
    await store.updatePeriod("id-1", { startDate: "2026-01-02", endDate: "2026-01-06" });

    expect(await store.load()).toEqual({
      periods: [{ id: "id-1", startDate: "2026-01-02", endDate: "2026-01-06" }],
    });
    expect(storage.has(PROFILE_KEY)).toBe(false);

    const exported = await store.exportData();
    expect(exported.account).toBeNull();
    expect(exported.periods).toHaveLength(1);
    expect(exported).not.toHaveProperty("profile");

    await store.deletePeriod("id-1");
    expect((await store.load()).periods).toEqual([]);

    await store.deleteAll();
    expect(storage.has(PROFILE_KEY)).toBe(false);
    expect(storage.has(PERIODS_KEY)).toBe(false);
  });

  it("refuses to update an entry that does not exist", async () => {
    const store = createDeviceStore(memoryStorage());
    await expect(
      store.updatePeriod("missing", { startDate: "2026-01-01", endDate: "2026-01-02" }),
    ).rejects.toBeInstanceOf(StoreError);
  });
});

describe("account store", () => {
  it("loads periods from the API and does not ask for a profile", async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ periods: [] }));
    const store = createAccountStore(fetcher, memoryStorage());

    await expect(store.load()).resolves.toEqual({ periods: [] });
    expect(fetcher).toHaveBeenCalledWith("/periods", { headers: undefined });
    expect(fetcher.mock.calls.some(([url]) => url === "/profile")).toBe(false);
  });

  it("moves this browser's periods into the account, then clears the browser copy", async () => {
    const storage = memoryStorage({
      [PROFILE_KEY]: JSON.stringify({ mode: "age", age: 25 }),
      [PERIODS_KEY]: JSON.stringify([
        { id: "local-1", startDate: "2026-01-01", endDate: "2026-01-05" },
        { id: "local-2", startDate: "2026-02-01", endDate: "2026-02-03" },
      ]),
    });
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/periods" && !init?.method) {
        return jsonResponse({
          periods: [{ id: "cloud-1", startDate: "2026-02-01", endDate: "2026-02-04" }],
        });
      }
      const body = JSON.parse(String(init?.body));
      return jsonResponse({ period: { id: "cloud-2", ...body } });
    });
    const store = createAccountStore(fetcher, storage);

    const data = await store.load();

    expect(data.movedFromDevice).toBe(true);
    expect(data.periods.map((period) => period.id).sort()).toEqual(["cloud-1", "cloud-2"]);
    const uploads = fetcher.mock.calls.filter(
      ([url, init]) => url === "/periods" && init?.method === "POST",
    );
    expect(uploads).toHaveLength(1);
    expect(fetcher.mock.calls.some(([url]) => url === "/profile")).toBe(false);
    expect(storage.has(PROFILE_KEY)).toBe(false);
    expect(storage.has(PERIODS_KEY)).toBe(false);
  });

  it("extends an account period so extra local days are not dropped", async () => {
    const storage = memoryStorage({
      [PERIODS_KEY]: JSON.stringify([
        { id: "local-1", startDate: "2026-02-01", endDate: "2026-02-06" },
      ]),
    });
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/periods" && !init?.method) {
        return jsonResponse({
          periods: [{ id: "cloud-1", startDate: "2026-02-01", endDate: "2026-02-03" }],
        });
      }
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        return jsonResponse({ period: { id: "cloud-1", ...body } });
      }
      throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
    });
    const store = createAccountStore(fetcher, storage);

    const data = await store.load();

    expect(data.movedFromDevice).toBe(true);
    expect(data.periods).toEqual([
      { id: "cloud-1", startDate: "2026-02-01", endDate: "2026-02-06" },
    ]);
    expect(storage.has(PERIODS_KEY)).toBe(false);
    const puts = fetcher.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(puts).toHaveLength(1);
    expect(JSON.parse(String(puts[0][1]?.body))).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-06",
    });
  });

  it("keeps the browser copy if moving it to the account fails", async () => {
    const storage = memoryStorage({
      [PERIODS_KEY]: JSON.stringify([
        { id: "local-1", startDate: "2026-01-01", endDate: "2026-01-05" },
      ]),
    });
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return jsonResponse({ periods: [] });
      return jsonResponse({ error: "Server down" }, 500);
    });
    const store = createAccountStore(fetcher, storage);

    await expect(store.load()).rejects.toThrow("Server down");
    expect(storage.has(PERIODS_KEY)).toBe(true);
  });

  it("turns API and network failures into readable errors", async () => {
    const failing = createAccountStore(
      async () => jsonResponse({ error: "Sign in required." }, 401),
      memoryStorage(),
    );
    await expect(failing.deletePeriod("x")).rejects.toThrow("Sign in required.");

    const offline = createAccountStore(async () => {
      throw new TypeError("Failed to fetch");
    }, memoryStorage());
    await expect(offline.exportData()).rejects.toThrow(/offline/);
  });

  it("deletes the account data and any leftover browser copy", async () => {
    const storage = memoryStorage({ [PROFILE_KEY]: JSON.stringify({ mode: "age", age: 25 }) });
    const fetcher = vi.fn(async () => jsonResponse({ ok: true }));
    const store = createAccountStore(fetcher, storage);

    await store.deleteAll();

    expect(fetcher).toHaveBeenCalledWith("/account", {
      method: "DELETE",
      headers: undefined,
    });
    expect(storage.has(PROFILE_KEY)).toBe(false);
  });
});
