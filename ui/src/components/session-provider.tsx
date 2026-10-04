"use client";

import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/lib/auth-client";

export function AppSessionProvider({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
