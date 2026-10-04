import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { AccountDeps } from "../account";
import { createQuery, createSupabaseFrom } from "../test/supabase-mock";

const requireUser = vi.fn();
const getSupabase = vi.fn();

function app() {
  const deps: AccountDeps = {
    requireUser,
    getSupabase,
    setupError: () => null,
  };
  return createApp(deps);
}

describe("periods API", () => {
  beforeEach(() => {
    requireUser.mockReset();
    getSupabase.mockReset();
  });

  it("GET lists the signed-in user's periods", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const { from } = createSupabaseFrom({
      data: [{ id: "p1", start_date: "2026-01-01", end_date: "2026-01-05" }],
      error: null,
    });
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/periods");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      periods: [{ id: "p1", startDate: "2026-01-01", endDate: "2026-01-05" }],
    });
  });

  it("POST rejects overlapping periods", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const { from } = createSupabaseFrom({
      data: [{ id: "p1", start_date: "2026-01-01", end_date: "2026-01-05" }],
      error: null,
    });
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/periods", {
      method: "POST",
      body: JSON.stringify({ startDate: "2026-01-05", endDate: "2026-01-08" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "This overlaps another saved period. Update or remove that entry first.",
    });
  });

  it("POST saves a valid period", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const existing = createQuery({ data: [], error: null });
    const inserted = createQuery({
      data: { id: "p2", start_date: "2026-02-01", end_date: "2026-02-04" },
      error: null,
    });
    const from = vi.fn().mockReturnValueOnce(existing).mockReturnValueOnce(inserted);
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/periods", {
      method: "POST",
      body: JSON.stringify({ startDate: "2026-02-01", endDate: "2026-02-04" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      period: { id: "p2", startDate: "2026-02-01", endDate: "2026-02-04" },
    });
    expect(existing.eq).toHaveBeenCalledWith("email", "ada@example.com");
    expect(inserted.insert).toHaveBeenCalledWith({
      email: "ada@example.com",
      start_date: "2026-02-01",
      end_date: "2026-02-04",
    });
  });
});

const ID = "5d7bad85-43be-4c04-b6cb-3374258e07e0";
const OTHER_ID = "0b6a3c1e-8f2d-4a9b-9c3e-2f1d4e5a6b7c";

describe("period by id API", () => {
  beforeEach(() => {
    requireUser.mockReset();
    getSupabase.mockReset();
    requireUser.mockResolvedValue({ email: "ada@example.com" });
  });

  it("PUT updates a period that does not overlap another entry", async () => {
    const existing = createQuery({
      data: [
        { id: ID, start_date: "2026-01-01", end_date: "2026-01-05" },
        { id: OTHER_ID, start_date: "2026-02-01", end_date: "2026-02-04" },
      ],
      error: null,
    });
    const updated = createQuery({
      data: { id: ID, start_date: "2026-01-02", end_date: "2026-01-06" },
      error: null,
    });
    const from = vi.fn().mockReturnValueOnce(existing).mockReturnValueOnce(updated);
    getSupabase.mockReturnValue({ from });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "PUT",
      body: JSON.stringify({ startDate: "2026-01-02", endDate: "2026-01-06" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      period: { id: ID, startDate: "2026-01-02", endDate: "2026-01-06" },
    });
    expect(updated.eq).toHaveBeenCalledWith("email", "ada@example.com");
  });

  it("PUT rejects an update that overlaps a different entry", async () => {
    const existing = createQuery({
      data: [
        { id: ID, start_date: "2026-01-01", end_date: "2026-01-05" },
        { id: OTHER_ID, start_date: "2026-02-01", end_date: "2026-02-04" },
      ],
      error: null,
    });
    getSupabase.mockReturnValue({ from: vi.fn(() => existing) });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "PUT",
      body: JSON.stringify({ startDate: "2026-01-30", endDate: "2026-02-02" }),
    });

    expect(response.status).toBe(400);
  });

  it("PUT returns 400 for a body that is not JSON", async () => {
    getSupabase.mockReturnValue({ from: vi.fn() });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "PUT",
      body: "not json",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request." });
  });

  it("PUT and DELETE return 404 for an id that is not a uuid, without touching the database", async () => {
    const from = vi.fn();
    getSupabase.mockReturnValue({ from });

    const put = await app().request("http://localhost/periods/p1", {
      method: "PUT",
      body: JSON.stringify({ startDate: "2026-01-02", endDate: "2026-01-06" }),
    });
    const del = await app().request("http://localhost/periods/p1", { method: "DELETE" });

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(from).not.toHaveBeenCalled();
  });

  it("DELETE returns 404 when the entry is missing", async () => {
    const query = createQuery({ data: null, error: null });
    getSupabase.mockReturnValue({ from: vi.fn(() => query) });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Entry not found." });
  });

  it("DELETE removes the signed-in user's entry", async () => {
    const query = createQuery({ data: { id: ID }, error: null });
    getSupabase.mockReturnValue({ from: vi.fn(() => query) });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(query.eq).toHaveBeenCalledWith("email", "ada@example.com");
  });

  it("returns a generic 500 when something unexpected throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getSupabase.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await app().request(`http://localhost/periods/${ID}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
