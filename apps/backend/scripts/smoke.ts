import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SmokeEnv {
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
  readonly supabaseServiceRoleKey: string;
  readonly backendUrl: string;
  readonly testEmail: string;
  readonly testPassword: string;
}

function readEnv(): SmokeEnv {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]?.trim().length === 0,
  );
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL as string,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY as string,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    backendUrl: process.env.BACKEND_SMOKE_URL ?? "http://127.0.0.1:3000",
    testEmail: process.env.BACKEND_SMOKE_EMAIL ?? `smoke-${Date.now()}@jobfit.local`,
    testPassword: process.env.BACKEND_SMOKE_PASSWORD ?? "SmokeTest_ChangeMe123!",
  };
}

async function main(): Promise<void> {
  const env = readEnv();
  console.info(`[smoke] target backend: ${env.backendUrl}`);

  const service: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const anon: SupabaseClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const createUserResult = await service.auth.admin.createUser({
    email: env.testEmail,
    password: env.testPassword,
    email_confirm: true,
  });
  if (createUserResult.error || !createUserResult.data.user) {
    throw new Error(`Failed to create smoke user: ${createUserResult.error?.message ?? "unknown"}`);
  }
  const userId = createUserResult.data.user.id;

  try {
    const prefsPayload = {
      user_id: userId,
      experience_years: 5,
      roles: ["backend", "platform"],
      tech_stack: ["typescript", "node.js", "postgres"],
      locations: ["remote"],
      work_type: ["remote"],
      min_salary: "",
      deal_breakers: ["on-call rotations > 1 week/month"],
    };
    const { error: prefsError } = await service
      .from("user_preferences")
      .upsert(prefsPayload, { onConflict: "user_id" });
    if (prefsError) throw new Error(`Failed to seed preferences: ${prefsError.message}`);

    const signIn = await anon.auth.signInWithPassword({
      email: env.testEmail,
      password: env.testPassword,
    });
    if (signIn.error || !signIn.data.session) {
      throw new Error(`Sign-in failed: ${signIn.error?.message ?? "no session"}`);
    }
    const jwt = signIn.data.session.access_token;

    const body = await readSampleJob();

    const start = Date.now();
    const response = await fetch(`${env.backendUrl}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - start;

    const raw = await response.text();
    console.info(`[smoke] ${response.status} in ${elapsed}ms`);

    if (!response.ok) {
      console.error(`[smoke] body: ${raw}`);
      process.exitCode = 1;
      return;
    }

    console.info(JSON.stringify(JSON.parse(raw), null, 2));
  } finally {
    await service.auth.admin.deleteUser(userId);
  }
}

async function readSampleJob(): Promise<unknown> {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, "sample-job.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${(error as Error).message}`);
  process.exit(1);
});
