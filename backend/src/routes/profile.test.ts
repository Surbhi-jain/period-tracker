import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { AccountDeps } from "../account";

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

describe("profile API", () => {
  beforeEach(() => {
    requireUser.mockReset();
    getSupabase.mockReset();
  });

  it("GET returns 401 when the user is not signed in", async () => {
    requireUser.mockResolvedValue(null);

    const response = await app().request("http://localhost/profile");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Sign in required." });
  });

  it("GET does not return a saved age", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });

    const response = await app().request("http://localhost/profile");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ profile: null });
  });

  it("PUT refuses to collect age", async () => {
    requireUser.mockResolvedValue({ email: "ada@example.com" });

    const response = await app().request("http://localhost/profile", { method: "PUT" });

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Luna does not collect age.",
    });
  });
});
