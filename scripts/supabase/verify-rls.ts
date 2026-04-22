import { createClient } from "@supabase/supabase-js";

interface RequiredEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLISHABLE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

function readEnv(): RequiredEnv {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]?.trim().length === 0,
  );
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL as string,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY as string,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}

async function main(): Promise<void> {
  const env = readEnv();
  const password = process.env.RLS_TEST_USER_PASSWORD ?? "RlsTest_ChangeMe123!";

  const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const runId = Date.now();
  const userAEmail = `rls-a-${runId}@jobfit.local`;
  const userBEmail = `rls-b-${runId}@jobfit.local`;

  const userA = await createTestUser(service, userAEmail, password);
  const userB = await createTestUser(service, userBEmail, password);

  try {
    const userAClient = await signInAs(anon, userAEmail, password);
    const userBClient = await signInAs(anon, userBEmail, password);

    await upsertOwnRow(userAClient, userA.id, 5, ["backend"]);
    await upsertOwnRow(userBClient, userB.id, 9, ["platform"]);

    const { data: aVisibleRows, error: aSelectError } = await userAClient
      .from("user_preferences")
      .select("user_id, experience_years, roles");
    assertNoError(aSelectError, "User A select own rows failed");
    if (!aVisibleRows || aVisibleRows.length !== 1 || aVisibleRows[0]?.user_id !== userA.id) {
      throw new Error("RLS violation: User A can see rows other than their own.");
    }

    const { data: forbiddenRead, error: forbiddenReadError } = await userAClient
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", userB.id);
    assertNoError(forbiddenReadError, "User A targeted read check failed");
    if ((forbiddenRead ?? []).length !== 0) {
      throw new Error("RLS violation: User A can read User B row.");
    }

    const { data: forbiddenUpdateRows, error: forbiddenUpdateError } = await userAClient
      .from("user_preferences")
      .update({ experience_years: 99 })
      .eq("user_id", userB.id)
      .select("user_id");
    assertNoError(forbiddenUpdateError, "User A targeted update check failed");
    if ((forbiddenUpdateRows ?? []).length !== 0) {
      throw new Error("RLS violation: User A can update User B row.");
    }

    const { data: totalRows, error: totalRowsError } = await service
      .from("user_preferences")
      .select("user_id, experience_years", { count: "exact" })
      .in("user_id", [userA.id, userB.id]);
    assertNoError(totalRowsError, "Service verification query failed");
    if ((totalRows ?? []).length !== 2) {
      throw new Error("Verification failed: expected exactly two inserted rows.");
    }

    console.info("RLS verification passed.");
    console.info(
      JSON.stringify(
        {
          userAVisibleCount: aVisibleRows.length,
          forbiddenReadCount: forbiddenRead?.length ?? 0,
          forbiddenUpdateCount: forbiddenUpdateRows?.length ?? 0,
          serviceVisibleRows: totalRows.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await service.auth.admin.deleteUser(userA.id);
    await service.auth.admin.deleteUser(userB.id);
  }
}

async function createTestUser(
  service: ReturnType<typeof createClient>,
  email: string,
  password: string,
): Promise<{ id: string }> {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assertNoError(error, `Failed to create test user ${email}`);
  if (!data.user?.id) throw new Error(`User creation returned no id for ${email}`);
  return { id: data.user.id };
}

async function signInAs(client: ReturnType<typeof createClient>, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assertNoError(error, `Failed to sign in ${email}`);
  if (!data.session) throw new Error(`Sign-in returned no session for ${email}`);
  return client;
}

async function upsertOwnRow(
  client: ReturnType<typeof createClient>,
  userId: string,
  years: number,
  roles: string[],
): Promise<void> {
  const payload = {
    user_id: userId,
    experience_years: years,
    roles,
    tech_stack: ["typescript"],
    locations: ["remote"],
    work_type: ["remote"],
    min_salary: "",
    deal_breakers: [],
  };

  const { error } = await client
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" });
  assertNoError(error, `Upsert failed for ${userId}`);
}

function assertNoError(error: { message?: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message ?? "unknown error"}`);
  }
}

main().catch((error) => {
  console.error(`RLS verification failed: ${(error as Error).message}`);
  process.exit(1);
});
