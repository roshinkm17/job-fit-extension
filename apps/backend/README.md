# @job-fit/backend

Stateless Fastify service that powers the `POST /analyze` endpoint for RoleGauge
extension. It verifies the caller's Supabase JWT, loads their preferences under RLS,
builds a deterministic prompt, and calls the LLM adapter.

## Endpoints

| Method | Path       | Description                                               |
| ------ | ---------- | --------------------------------------------------------- |
| `GET`  | `/health`  | Liveness probe. Returns `{ "status": "ok" }`.             |
| `POST` | `/analyze` | Runs a fit analysis for the authenticated user.           |

### `POST /analyze`

**Request**

```http
POST /analyze
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "job": {
    "title": "Senior Backend Engineer",
    "company": "Acme",
    "location": "Remote",
    "description": "..."
  }
}
```

**Response (200)**

```json
{
  "fitScore": 82,
  "matches": [{ "label": "Remote" }, { "label": "TypeScript" }],
  "mismatches": [{ "label": "Experience gap", "detail": "Job requires 6+ years, candidate has 5" }],
  "summary": "Strong stack alignment; experience target slightly above candidate."
}
```

### Error contract

All errors return `{ "error": { "code", "message" } }` (plus `issues` for Zod failures).

| Status | Code                     | When                                                   |
| -----: | ------------------------ | ------------------------------------------------------ |
|   400  | `invalid_request`        | Body fails `AnalyzeRequestSchema`.                     |
|   401  | `missing_auth`           | No `Authorization: Bearer ...` header.                 |
|   401  | `invalid_auth`           | Supabase rejects the token.                            |
|   422  | `preferences_not_found`  | User has no row in `user_preferences`.                 |
|   502  | `llm_failure`            | Provider errored or returned invalid JSON.             |
|   500  | `internal_error`         | Unexpected failure (see logs).                         |

## Environment variables

Loaded from `.env.local` (via Node's `--env-file`) during development.

| Variable                      | Required | Notes                                          |
| ----------------------------- | :------: | ---------------------------------------------- |
| `SUPABASE_URL`                |    ✅    | From Supabase project settings.                |
| `SUPABASE_PUBLISHABLE_KEY`    |    ✅    | Anon/publishable API key.                      |
| `SUPABASE_SERVICE_ROLE_KEY`   |    —     | Only used by the smoke script.                 |
| `LLM_PROVIDER`                |    ✅    | `openai`, `anthropic`, or `groq`.              |
| `LLM_MODEL`                   |    —     | Defaults per provider in `@job-fit/llm`.       |
| `OPENAI_API_KEY` etc.         |    ✅    | For the chosen provider.                       |
| `BACKEND_PORT`                |    —     | Default `3000`.                                |
| `BACKEND_HOST`                |    —     | Default `0.0.0.0`.                             |
| `BACKEND_LOG_LEVEL`           |    —     | `info` by default.                             |
| `BACKEND_CORS_ORIGINS`        |    —     | Comma-separated allowed origins.               |
| `ANALYZE_TEMPERATURE`         |    —     | Default `0.2`.                                 |
| `ANALYZE_MAX_OUTPUT_TOKENS`   |    —     | Default `600`.                                 |

## Scripts

```bash
pnpm --filter @job-fit/backend dev        # hot-reload dev server on :3000
pnpm --filter @job-fit/backend test       # vitest unit + integration tests
pnpm --filter @job-fit/backend typecheck
pnpm --filter @job-fit/backend build
pnpm --filter @job-fit/backend smoke      # end-to-end: seed user → sign in → POST /analyze
```

## Manual verification

```bash
# 1. start the server
pnpm --filter @job-fit/backend dev

# 2. in another terminal, run the smoke test end-to-end
pnpm --filter @job-fit/backend smoke
```

The smoke test creates a throwaway Supabase user, seeds `user_preferences`,
signs in to get a JWT, hits `POST /analyze`, prints the result, and deletes
the user on exit.
