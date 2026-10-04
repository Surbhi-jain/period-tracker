import { afterEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn((...args: unknown[]) => ({ kind: "client", args }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

vi.mock("./debug", () => ({
  lunaDebug: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  createClient.mockClear();
});

describe("getSupabaseServer", () => {
  it("throws when the service role key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { getSupabaseServer } = await import("./supabase");

    expect(() => getSupabaseServer()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("prefers the service role key and reuses the client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const { getSupabaseServer, resetSupabaseServer } = await import("./supabase");
    resetSupabaseServer();

    const first = getSupabaseServer();
    const second = getSupabaseServer();

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-key",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });
});
