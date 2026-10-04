import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { AccountDeps } from "../account";
import { createQuery } from "../test/supabase-mock";

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

describe("account API", () => {
  beforeEach(() => {
    requireUser.mockReset();
    getSupabase.mockReset();
  });

  it("requires sign-in for export and delete", async () => {
    requireUser.mockResolvedValue(null);

    expect((await app().request("http://localhost/account")).status).toBe(401);
    expect((await app().request("http://localhost/account", { method: "DELETE" })).status).toBe(
      401,
    );
  });

  it("exports every period for the signed-in email and no age", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const periods = createQuery({
      data: [{ id: "p1", start_date: "2026-01-01", end_date: "2026-01-05" }],
      error: null,
    });
    const from = vi.fn(() => periods);
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/account");
    const body = (await response.json()) as {
      account: string;
      periods: unknown[];
      exportedAt: string;
      profile?: unknown;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      account: "ada@example.com",
      periods: [{ id: "p1", startDate: "2026-01-01", endDate: "2026-01-05" }],
    });
    expect(body).not.toHaveProperty("profile");
    expect(typeof body.exportedAt).toBe("string");
    expect(from).toHaveBeenCalledWith("periods");
    expect(from).not.toHaveBeenCalledWith("profiles");
    expect(periods.eq).toHaveBeenCalledWith("email", "ada@example.com");
  });

  it("deletes periods for only the signed-in email", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const periods = createQuery({ data: null, error: null });
    const from = vi.fn(() => periods);
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/account", { method: "DELETE" });

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("periods");
    expect(from).not.toHaveBeenCalledWith("profiles");
    expect(periods.delete).toHaveBeenCalled();
    expect(periods.eq).toHaveBeenCalledWith("email", "ada@example.com");
  });

  it("returns an error if periods could not be deleted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireUser.mockResolvedValue({ email: "ada@example.com" });
    const periods = createQuery({ data: null, error: { message: "db down" } });
    const from = vi.fn(() => periods);
    getSupabase.mockReturnValue({ from });

    const response = await app().request("http://localhost/account", { method: "DELETE" });

    expect(response.status).toBe(500);
  });
});
