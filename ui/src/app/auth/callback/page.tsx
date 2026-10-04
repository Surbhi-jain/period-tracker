"use client";

import { useEffect } from "react";
import { writeToken } from "@/lib/auth-client";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/tracker";
  return value;
}

export default function AuthCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const token = hash.get("token") ?? query.get("token");
    if (token) writeToken(token);
    window.location.replace(safeNext(query.get("next")));
  }, []);

  return (
    <p className="tracker-status" role="status">
      Signing you in…
    </p>
  );
}
