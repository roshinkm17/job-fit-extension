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

declare const process: {
  readonly env: Record<string, string | undefined>;
};

function read(name: string): string | undefined {
  const raw = process.env[name];
  return raw && raw.trim().length > 0 ? raw.trim() : undefined;
}

function requireEnv(name: string): string {
  const value = read(name);
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in apps/extension/.env (see apps/extension/.env.example) and rebuild the extension.`,
    );
  }
  return value;
}

let cached: ExtensionEnv | null = null;

export function readEnv(): ExtensionEnv {
  if (cached) return cached;
  cached = {
    backendUrl: requireEnv("PLASMO_PUBLIC_BACKEND_URL"),
    supabaseUrl: requireEnv("PLASMO_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: requireEnv("PLASMO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    webAppUrl: requireEnv("PLASMO_PUBLIC_WEB_APP_URL"),
  };
  return cached;
}

/** Test-only hook: lets specs stub the environment without touching process.env. */
export function __setEnvForTests(next: ExtensionEnv | null): void {
  cached = next;
}
