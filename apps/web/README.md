# @job-fit/web

Vite + React + TypeScript + shadcn/ui preferences app. Authenticates users with
Supabase email/password and lets them manage the preferences used by RoleGauge
scoring.

## Stack

- Vite 7 with React 19 and TypeScript (strict mode, extends `tsconfig.base.json`).
- shadcn/ui (`nova` preset, radix base) + Tailwind CSS v4.
- `@supabase/supabase-js` for auth and RLS-enforced `user_preferences` IO.
- Root-level Biome for formatting/linting, Vitest for tests.

## Flow

1. Signed-out users see a sign-in card (email + password, with a sign-up flip).
2. Signed-in users see a preferences form pre-populated from their saved row
   in `public.user_preferences`. Saving upserts the row via Supabase RLS.
3. No job data is ever persisted here — only the preference profile.

## Scripts

```bash
pnpm --filter @job-fit/web dev        # vite dev server on :5173
pnpm --filter @job-fit/web typecheck
pnpm --filter @job-fit/web test       # vitest
pnpm --filter @job-fit/web build      # production bundle
```

## Environment variables

The web app loads env vars from the repo-root `.env.local` (via `vite.config.ts`).
At minimum it needs:

- `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
- `SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)
- Optional: `VITE_BACKEND_URL` — defaults to `http://localhost:3000`.

## Manual verification

The live Supabase project disables anon signups, so seed a confirmed user via the
service-role admin API, then sign in through the UI:

```bash
# From the repo root (expects SUPABASE_* in .env.local)
pnpm seed:web-user
# Prints: {"email":"web-smoke@jobfit.local","password":"WebSmoke_ChangeMe123!"}

pnpm web:dev
# Open http://localhost:5173
# 1. Sign in with the seeded email + password
# 2. Fill the preferences form, click "Save preferences"
# 3. Refresh — the form reloads your saved values from Supabase
# 4. Clean up: pnpm seed:web-user -- --delete
```
