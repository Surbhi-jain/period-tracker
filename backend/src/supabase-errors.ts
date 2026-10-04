export const SERVICE_ROLE_SETUP_ERROR =
  "Add SUPABASE_SERVICE_ROLE_KEY from Supabase (Project Settings → API → service_role) to the backend environment, then restart the API.";

export const GENERIC_DATABASE_ERROR =
  "We could not reach your saved data. Please try again in a moment.";

export function supabaseSetupError() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL in the backend environment.";
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return SERVICE_ROLE_SETUP_ERROR;
  }
  return null;
}

export function publicDatabaseError(message: string) {
  if (/row-level security/i.test(message)) {
    return SERVICE_ROLE_SETUP_ERROR;
  }
  if (process.env.NODE_ENV === "production") {
    return GENERIC_DATABASE_ERROR;
  }
  return message;
}
