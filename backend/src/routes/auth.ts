import { Hono } from "hono";
import { lunaDebug } from "../debug";
import { frontendUrl } from "../env";
import { googleAuthUrl, safeNextPath, userFromGoogleCode, userFromGoogleIdToken } from "../google";
import { json, jsonError, readJsonObject } from "../http";
import {
  attachSessionCookie,
  clearSessionCookie,
  createSessionToken,
  requireSignedInUser,
} from "../session";

export function authRoutes() {
  const routes = new Hono();

  routes.get("/google", (c) => {
    const next = safeNextPath(c.req.query("next"));
    const state = Buffer.from(JSON.stringify({ next }), "utf8").toString("base64url");
    return c.redirect(googleAuthUrl(state), 302);
  });

  routes.get("/google/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    let next = "/tracker";
    if (state) {
      try {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
          next?: string;
        };
        next = safeNextPath(parsed.next);
      } catch {
        next = "/tracker";
      }
    }

    if (!code) return c.redirect(`${frontendUrl()}/?error=sign-in`, 302);

    try {
      const user = await userFromGoogleCode(code);
      if (!user) return c.redirect(`${frontendUrl()}/?error=sign-in`, 302);
      const token = await createSessionToken(user);
      attachSessionCookie(c, token);
      lunaDebug("auth", "Google sign-in succeeded", { email: user.email });
      return c.redirect(`${frontendUrl()}/auth/callback?next=${encodeURIComponent(next)}#token=${token}`, 302);
    } catch (error) {
      console.error("[Luna] Google callback failed:", error instanceof Error ? error.message : error);
      return c.redirect(`${frontendUrl()}/?error=sign-in`, 302);
    }
  });

  routes.post("/google", async (c) => {
    const body = await readJsonObject(c.req.raw);
    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    if (!idToken) return jsonError("A Google ID token is required.", 400);

    try {
      const user = await userFromGoogleIdToken(idToken);
      if (!user) return jsonError("Google did not share an email address.", 401);
      const token = await createSessionToken(user);
      attachSessionCookie(c, token);
      lunaDebug("auth", "Google ID token sign-in succeeded", { email: user.email });
      return json({ token, user });
    } catch (error) {
      console.error("[Luna] Google ID token failed:", error instanceof Error ? error.message : error);
      return jsonError("Google sign-in failed.", 401);
    }
  });

  routes.get("/me", async (c) => {
    const user = await requireSignedInUser(c);
    if (!user) return jsonError("Sign in required.", 401);
    return json({ user });
  });

  routes.post("/sign-out", (c) => {
    clearSessionCookie(c);
    return json({ ok: true });
  });

  return routes;
}
