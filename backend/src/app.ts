import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AccountDeps } from "./account";
import { frontendUrl } from "./env";
import { json } from "./http";
import { accountRoutes } from "./routes/account";
import { authRoutes } from "./routes/auth";
import { periodRoutes } from "./routes/periods";
import { profileRoutes } from "./routes/profile";
import { requireSignedInUser } from "./session";
import { getSupabaseServer } from "./supabase";
import { supabaseSetupError } from "./supabase-errors";

export const defaultDeps: AccountDeps = {
  requireUser: requireSignedInUser,
  getSupabase: getSupabaseServer,
  setupError: supabaseSetupError,
};

export function createApp(deps: AccountDeps = defaultDeps) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: frontendUrl(),
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/health", () => json({ ok: true }));
  app.route("/auth", authRoutes());
  app.route("/periods", periodRoutes(deps));
  app.route("/account", accountRoutes(deps));
  app.route("/profile", profileRoutes(deps));

  return app;
}

export const app = createApp();
