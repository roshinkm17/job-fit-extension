import { createClient } from "@supabase/supabase-js";

/**
 * Seed (or re-seed) a confirmed email/password test user for manually verifying
 * the preferences web app. Signup via anon key is blocked on the live project
 * (email confirmations are required), so we use the service-role admin API.
 *
 * Usage:
 *   pnpm exec tsx --env-file=.env.local scripts/supabase/seed-web-user.mts
 *   pnpm exec tsx --env-file=.env.local scripts/supabase/seed-web-user.mts --delete
 */

interface Env {
  readonly url: string;
  readonly serviceKey: string;
  readonly email: string;
  readonly password: string;
}

function readEnv(): Env {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }
  return {
    url,
    serviceKey,
    email: process.env.WEB_SMOKE_EMAIL ?? "web-smoke@jobfit.local",
    password: process.env.WEB_SMOKE_PASSWORD ?? "WebSmoke_ChangeMe123!",
  };
}

async function main(): Promise<void> {
  const env = readEnv();
  const svc = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const shouldDelete = process.argv.includes("--delete");

  const { data: list, error: listError } = await svc.auth.admin.listUsers();
  if (listError) throw listError;
  const found = list.users.find((u) => u.email === env.email);

  if (found) {
    await svc.auth.admin.deleteUser(found.id);
    console.info(`[seed] deleted existing user ${env.email}`);
  }
  if (shouldDelete) return;

  const { data, error } = await svc.auth.admin.createUser({
    email: env.email,
    password: env.password,
    email_confirm: true,
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error("Supabase returned no user after create");

  console.info(`[seed] created ${env.email} id=${user.id}`);
  console.info(JSON.stringify({ email: env.email, password: env.password }));
}

main().catch((error) => {
  console.error(`[seed] failed: ${(error as Error).message}`);
  process.exit(1);
});
