# Supabase Setup (Phase 3)

Project created for this repo:

- Name: `job-fit-extension`
- Region: `ap-south-1`
- Project ID: `lokcsniznppczuhdyhnx`

## What was applied

- Migration file: `supabase/migrations/20260422115000_create_user_preferences.sql`
- Table: `public.user_preferences`
- RLS: enabled
- Policies:
  - `user_preferences_select_own` (`SELECT` for `authenticated`)
  - `user_preferences_insert_own` (`INSERT` for `authenticated`)
  - `user_preferences_update_own` (`UPDATE` for `authenticated`)

No job descriptions, fit scores, or LLM analysis output are stored.

## Required env vars

Set these in `.env.local`:

```bash
SUPABASE_PROJECT_ID=lokcsniznppczuhdyhnx
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## RLS verification script

Run:

```bash
set -a
source .env.local
set +a
pnpm verify:rls
```

Expected output:

- `RLS verification passed.`
- `userAVisibleCount: 1`
- `forbiddenReadCount: 0`
- `forbiddenUpdateCount: 0`
- `serviceVisibleRows: 2`

The script creates two temporary users, writes one row per user, validates isolation,
then deletes both users.
