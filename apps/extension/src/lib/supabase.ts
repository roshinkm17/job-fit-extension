import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv } from "./env";
import { createExtensionStorage } from "./storage";

let cached: SupabaseClient | null = null;

/**
 * Singleton Supabase client used across every extension surface (content
 * scripts, background, popup). The session lives in `chrome.storage.local`,
 * so all surfaces share one source of truth and supabase-js handles refresh
 * in the background.
 *
 * `detectSessionInUrl` is explicitly false: we never land on a URL that
 * carries OAuth fragments inside the extension context, and leaving it on
 * would cause supabase-js to attempt to read `window.location` in surfaces
 * like the popup where that would be misleading.
 */
export function getExtensionSupabase(): SupabaseClient {
  if (cached) return cached;
  const env = readEnv();
  cached = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "job-fit.ext.auth",
      storage: createExtensionStorage(),
    },
  });
  return cached;
}

/**
 * Returns a non-expired access token, running `refreshSession` when the
 * stored session is within one minute of expiry.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = getExtensionSupabase();
  const {
    data: { session: initial },
  } = await supabase.auth.getSession();
  if (!initial) return null;

  const expiresAtMs = initial.expires_at ? initial.expires_at * 1000 : 0;
  const bufferMs = 60_000;
  if (expiresAtMs > 0 && Date.now() < expiresAtMs - bufferMs) {
    return initial.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

/** Test-only hook to reset the cached client between specs. */
export function __resetExtensionSupabaseForTests(): void {
  cached = null;
}
