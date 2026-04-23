/**
 * Plasmo exposes `process.env.PLASMO_PUBLIC_*` at build time to scripts
 * running inside the extension. We read them here once and validate up-front
 * so a missing value fails loudly on boot rather than silently at request
 * time.
 */
interface ExtensionEnv {
  readonly backendUrl: string;
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
  readonly webAppUrl: string;
}

/**
 * Plasmo/Parcel only inlines `PLASMO_PUBLIC_*` when the property access is
 * static (e.g. `process.env.PLASMO_PUBLIC_BACKEND_URL`). Using
 * `process.env[someVariable]` leaves nothing in the webextension bundle, so
 * every value was undefined at runtime and `readEnv()` always failed after
 * build. Keep each key spelled out here.
 */
function trimValue(raw: string | undefined): string | undefined {
  if (!raw || raw.trim().length === 0) return undefined;
  return raw.trim();
}

let cached: ExtensionEnv | null = null;

export function readEnv(): ExtensionEnv {
  if (cached) return cached;
  const backendUrl = trimValue(process.env.PLASMO_PUBLIC_BACKEND_URL);
  const supabaseUrl = trimValue(process.env.PLASMO_PUBLIC_SUPABASE_URL);
  const supabasePublishableKey = trimValue(process.env.PLASMO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const webAppUrl = trimValue(process.env.PLASMO_PUBLIC_WEB_APP_URL);
  if (!backendUrl) {
    throw new Error(
      "Missing PLASMO_PUBLIC_BACKEND_URL. Set it in apps/extension/.env (see apps/extension/.env.example) and rebuild the extension.",
    );
  }
  if (!supabaseUrl) {
    throw new Error(
      "Missing PLASMO_PUBLIC_SUPABASE_URL. Set it in apps/extension/.env (see apps/extension/.env.example) and rebuild the extension.",
    );
  }
  if (!supabasePublishableKey) {
    throw new Error(
      "Missing PLASMO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Set it in apps/extension/.env (see apps/extension/.env.example) and rebuild the extension.",
    );
  }
  if (!webAppUrl) {
    throw new Error(
      "Missing PLASMO_PUBLIC_WEB_APP_URL. Set it in apps/extension/.env (see apps/extension/.env.example) and rebuild the extension.",
    );
  }
  cached = { backendUrl, supabaseUrl, supabasePublishableKey, webAppUrl };
  return cached;
}

/** Test-only hook: lets specs stub the environment without touching process.env. */
export function __setEnvForTests(next: ExtensionEnv | null): void {
  cached = next;
}
