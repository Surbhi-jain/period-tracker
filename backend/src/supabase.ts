import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { lunaDebug } from "./debug";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";
import { SERVICE_ROLE_SETUP_ERROR, supabaseSetupError } from "./supabase-errors";

let serverClient: SupabaseClient | null = null;

export function getSupabaseServer() {
  if (serverClient) {
    lunaDebug("supabase", "Reusing existing server client");
    return serverClient;
  }

  const setupError = supabaseSetupError();
  const url = supabaseUrl();
  const serviceKey = supabaseServiceRoleKey();

  lunaDebug("supabase", "Creating server client", {
    hasUrl: Boolean(url),
    usingServiceRole: Boolean(serviceKey),
  });

  if (setupError || !url || !serviceKey) {
    lunaDebug("supabase", "Missing URL or service role key");
    throw new Error(setupError ?? SERVICE_ROLE_SETUP_ERROR);
  }

  serverClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}

export function resetSupabaseServer() {
  serverClient = null;
}
