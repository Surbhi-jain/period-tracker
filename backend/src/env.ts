import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname, "../../.env.local") });
config({ path: resolve(import.meta.dirname, "../.env") });

function required(name: string) {
  return process.env[name]?.trim() || "";
}

export function frontendUrl() {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function apiUrl() {
  return (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`).replace(
    /\/$/,
    "",
  );
}

export function authSecret() {
  return required("AUTH_SECRET");
}

export function googleClientId() {
  return required("AUTH_GOOGLE_ID");
}

export function googleClientSecret() {
  return required("AUTH_GOOGLE_SECRET");
}

export function supabaseUrl() {
  return required("SUPABASE_URL") || required("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}
