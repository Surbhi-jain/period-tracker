import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GENERIC_DATABASE_ERROR,
  SERVICE_ROLE_SETUP_ERROR,
  publicDatabaseError,
  supabaseSetupError,
} from "./supabase-errors";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabaseSetupError", () => {
  it("asks for the project URL when it is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    expect(supabaseSetupError()).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("asks for the service role key when it is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(supabaseSetupError()).toBe(SERVICE_ROLE_SETUP_ERROR);
  });

  it("returns null when the server key is present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    expect(supabaseSetupError()).toBeNull();
  });
});

describe("publicDatabaseError", () => {
  it("turns a row-level security error into the setup message", () => {
    expect(
      publicDatabaseError(
        'new row violates row-level security policy for table "profiles"',
      ),
    ).toBe(SERVICE_ROLE_SETUP_ERROR);
  });

  it("keeps other database errors in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(publicDatabaseError("relation profiles does not exist")).toBe(
      "relation profiles does not exist",
    );
  });

  it("hides database details from visitors in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(publicDatabaseError("relation profiles does not exist")).toBe(
      GENERIC_DATABASE_ERROR,
    );
  });
});
