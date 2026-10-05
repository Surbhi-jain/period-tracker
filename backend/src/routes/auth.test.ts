import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../google", () => ({
  googleAuthUrl: (state: string) =>
    `https://accounts.google.test/auth?state=${encodeURIComponent(state)}`,
  safeNextPath(value: string | null | undefined) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return "/tracker";
    return value;
  },
  userFromGoogleCode: vi.fn(),
  userFromGoogleIdToken: vi.fn(),
}));

import { createApp } from "../app";
import { userFromGoogleCode } from "../google";
import { OAUTH_STATE_COOKIE } from "../session";

const googleUser = vi.mocked(userFromGoogleCode);

function cookieValue(response: Response, name: string) {
  const lines = response.headers.getSetCookie?.() ?? [];
  const line = lines.find((item) => item.startsWith(`${name}=`));
  if (!line) return null;
  return line.split(";")[0].slice(name.length + 1);
}

function stateFrom(location: string) {
  const state = new URL(location).searchParams.get("state");
  if (!state) throw new Error("missing state");
  return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    next?: string;
    nonce?: string;
  };
}

describe("Google sign-in state", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-at-least-32-characters";
    googleUser.mockReset();
  });

  it("stores a nonce cookie that the callback must match", async () => {
    const start = await createApp().request("http://localhost/auth/google?next=/tracker");
    expect(start.status).toBe(302);
    const location = start.headers.get("location") ?? "";
    const nonce = cookieValue(start, OAUTH_STATE_COOKIE);
    expect(nonce).toBeTruthy();
    expect(stateFrom(location).nonce).toBe(nonce);

    googleUser.mockResolvedValue({ email: "ada@example.com", name: "Ada" });
    const state = new URL(location).searchParams.get("state");
    const ok = await createApp().request(
      `http://localhost/auth/google/callback?code=good&state=${encodeURIComponent(state ?? "")}`,
      { headers: { cookie: `${OAUTH_STATE_COOKIE}=${nonce}` } },
    );
    expect(ok.status).toBe(302);
    expect(ok.headers.get("location")).toContain("/auth/callback");
    expect(googleUser).toHaveBeenCalledWith("good");
  });

  it("does not sign in a browser that did not start the Google flow", async () => {
    googleUser.mockResolvedValue({ email: "attacker@example.com", name: "Attacker" });
    const nonce = "browser-a-nonce";
    const state = Buffer.from(JSON.stringify({ next: "/tracker", nonce }), "utf8").toString(
      "base64url",
    );

    const stolen = await createApp().request(
      `http://localhost/auth/google/callback?code=stolen&state=${encodeURIComponent(state)}`,
    );

    expect(stolen.status).toBe(302);
    expect(stolen.headers.get("location")).toContain("error=sign-in");
    expect(googleUser).not.toHaveBeenCalled();
  });
});
