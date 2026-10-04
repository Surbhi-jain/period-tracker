"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiUrl } from "./api-url";

const TOKEN_KEY = "luna-session-token";

export type SessionUser = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type Session = { user: SessionUser } | null;
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

const SessionContext = createContext<{ data: Session; status: SessionStatus }>({
  data: null,
  status: "loading",
});

export function readToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function writeToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...init, credentials: "include", headers });
}

export function useSession() {
  return useContext(SessionContext);
}

export function signIn(_provider?: string, options?: { redirectTo?: string }) {
  const next = options?.redirectTo ?? "/tracker";
  window.location.assign(apiUrl(`/auth/google?next=${encodeURIComponent(next)}`));
}

export async function signOut(options?: { redirectTo?: string }) {
  try {
    await apiFetch("/auth/sign-out", { method: "POST" });
  } catch {
    // Leave the page even if the API is unreachable.
  }
  clearToken();
  window.location.assign(options?.redirectTo ?? "/");
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Session>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user?: SessionUser };
      })
      .then((body) => {
        if (cancelled) return;
        if (body?.user?.email) {
          setData({ user: body.user });
          setStatus("authenticated");
        } else {
          setData(null);
          setStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setStatus("unauthenticated");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={{ data, status }}>{children}</SessionContext.Provider>;
}
