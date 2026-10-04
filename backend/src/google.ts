import { OAuth2Client } from "google-auth-library";
import { apiUrl, googleClientId, googleClientSecret } from "./env";
import { normalizeEmail } from "./email";
import type { SessionUser } from "./session";

function oauthClient() {
  return new OAuth2Client({
    clientId: googleClientId(),
    clientSecret: googleClientSecret(),
    redirectUri: `${apiUrl()}/auth/google/callback`,
  });
}

export function googleAuthUrl(state: string) {
  return oauthClient().generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });
}

export async function userFromGoogleCode(code: string): Promise<SessionUser | null> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const response = await client.request<{
    email?: string;
    name?: string;
    picture?: string;
  }>({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });
  const email = normalizeEmail(response.data.email);
  if (!email) return null;
  return {
    email,
    name: response.data.name,
    image: response.data.picture,
  };
}

export async function userFromGoogleIdToken(idToken: string): Promise<SessionUser | null> {
  const ticket = await oauthClient().verifyIdToken({
    idToken,
    audience: googleClientId(),
  });
  const payload = ticket.getPayload();
  const email = normalizeEmail(payload?.email);
  if (!email) return null;
  return {
    email,
    name: payload?.name,
    image: payload?.picture,
  };
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/tracker";
  return value;
}
