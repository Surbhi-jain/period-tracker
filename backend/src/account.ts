import type { Context } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lunaDebug } from "./debug";
import { jsonError } from "./http";
import type { SessionUser } from "./session";
import { publicDatabaseError, supabaseSetupError } from "./supabase-errors";

export type AccountContext = {
  user: SessionUser;
  supabase: SupabaseClient;
  c: Context;
};

export type AccountDeps = {
  requireUser: (c: Context) => Promise<SessionUser | null>;
  getSupabase: () => SupabaseClient;
  setupError?: () => string | null;
};

export function databaseError(scope: string, message: string) {
  console.error(`[Luna] ${scope} database error:`, message);
  return jsonError(publicDatabaseError(message), 500);
}

export async function withAccount(
  c: Context,
  scope: string,
  deps: AccountDeps,
  handler: (context: AccountContext) => Promise<Response>,
): Promise<Response> {
  try {
    lunaDebug(scope, "start");
    const user = await deps.requireUser(c);
    if (!user) {
      lunaDebug(scope, "rejected: not signed in");
      return jsonError("Sign in required.", 401);
    }

    const setupError = (deps.setupError ?? supabaseSetupError)();
    if (setupError) {
      lunaDebug(scope, "rejected: database not configured");
      return jsonError(setupError, 503);
    }

    return await handler({ user, supabase: deps.getSupabase(), c });
  } catch (error) {
    console.error(
      `[Luna] ${scope} failed:`,
      error instanceof Error ? error.message : error,
    );
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
