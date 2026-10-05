import { randomBytes, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { lunaDebug } from "./debug";
import { normalizeEmail } from "./email";
import { apiUrl, authSecret } from "./env";

export const SESSION_COOKIE = "luna_session";

export type SessionUser = {
  email: string;
  name?: string;
  image?: string;
};

function secretKey() {
  return new TextEncoder().encode(authSecret());
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name ?? "",
    picture: user.image ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const email = normalizeEmail(typeof payload.email === "string" ? payload.email : payload.sub);
    if (!email) return null;
    return {
      email,
      name: typeof payload.name === "string" && payload.name ? payload.name : undefined,
      image: typeof payload.picture === "string" && payload.picture ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

export function tokenFromRequest(c: Context) {
  const header = c.req.header("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return getCookie(c, SESSION_COOKIE) ?? null;
}

export async function requireSignedInUser(c: Context): Promise<SessionUser | null> {
  const token = tokenFromRequest(c);
  if (!token) {
    lunaDebug("auth", "No signed-in user with an email on this request");
    return null;
  }

  const user = await readSessionToken(token);
  if (!user) {
    lunaDebug("auth", "No signed-in user with an email on this request");
    return null;
  }

  lunaDebug("auth", "Signed-in user found", { email: user.email });
  return user;
}

export function attachSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "None",
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    sameSite: "None",
    secure: true,
  });
}

export const OAUTH_STATE_COOKIE = "luna_oauth_state";
const OAUTH_STATE_MAX_AGE = 60 * 10;

function oauthCookieSecure() {
  return apiUrl().startsWith("https://");
}

export function newOAuthNonce() {
  return randomBytes(32).toString("base64url");
}

export function oauthNoncesMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function attachOAuthStateCookie(c: Context, nonce: string) {
  setCookie(c, OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: oauthCookieSecure(),
    maxAge: OAUTH_STATE_MAX_AGE,
  });
}

export function readOAuthStateCookie(c: Context) {
  return getCookie(c, OAUTH_STATE_COOKIE) ?? null;
}

export function clearOAuthStateCookie(c: Context) {
  deleteCookie(c, OAUTH_STATE_COOKIE, {
    path: "/",
    sameSite: "Lax",
    secure: oauthCookieSecure(),
  });
}
