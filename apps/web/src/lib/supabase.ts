import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv } from "./env";

let cached: SupabaseClient | undefined;

/**
 * Return a singleton Supabase browser client configured with the project's
 * publishable key. Sessions are persisted to `localStorage` so reloads keep
 * the user signed in, and the `detectSessionInUrl` flag handles OAuth /
 * magic-link redirects out of the box if we add them later.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!cached) {
    const env = readEnv();
    cached = createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "job-fit.auth",
      },
    });
  }
  return cached;
}
