import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { lunaDebug } from "./debug";
import { normalizeEmail } from "./email";
import { authSecret } from "./env";

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
