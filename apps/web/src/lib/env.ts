interface WebEnv {
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
  readonly backendUrl: string;
}

function required(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing ${name}. Add it to the repo-root .env.local (see .env.example) and restart vite.`,
    );
  }
  return value.trim();
}

export function readEnv(): WebEnv {
  return {
    supabaseUrl: required(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
    supabasePublishableKey: required(
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ),
    backendUrl: import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:3000",
  };
}
