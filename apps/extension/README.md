# @job-fit/extension

Chrome extension (Manifest V3, Plasmo + React 18) that reads LinkedIn job pages
and scores them against the user’s saved preferences via the Fastify
`POST /analyze` API.

## Behaviour

- Content script on `https://www.linkedin.com/jobs/*` — job extraction, match
  card UI, “Check match score” flow
- **Session hand-off**: the preferences web app (same Supabase project) sends
  `access_token` / `refresh_token` to the extension background via
  `chrome.runtime.onMessageExternal` when `VITE_CHROME_EXTENSION_ID` is set
- **Analyze**: `createHttpAnalyze` in `src/lib/api.ts` POSTs
  `AnalyzeRequest` JSON with `Authorization: Bearer <supabase access token>`;
  401 → one `refreshSession()` retry then a second request
- **Mock mode**: in Vitest, `getAnalyze()` uses the deterministic mock. For a
  local build without a backend, set `PLASMO_PUBLIC_USE_MOCK_ANALYZE=1` in
  `apps/extension/.env`

## Config

Copy `apps/extension/.env.example` → `apps/extension/.env` and set
`PLASMO_PUBLIC_*` (see that file). Rebuild after changes — Plasmo inlines
public env at compile time.

## Backend CORS

The backend must list your extension origin in `BACKEND_CORS_ORIGINS`, e.g.:

`chrome-extension://<extension-id>`

The id comes from `chrome://extensions` (unpacked) or the Chrome Web Store
after publishing.

**Production web app + API**: add your deployed web origin to
`package.json` → `manifest.externally_connectable.matches` and your API host to
`manifest.host_permissions` before building, then load from `.env` as needed.

## Layout (high level)

```
apps/extension/src/
├─ background/index.ts     # onMessageExternal → Supabase setSession / signOut
├─ contents/linkedin.tsx  # Plasmo CSUI, extraction + match card
├─ popup.tsx              # Sign-in status + link to web app
├─ features/match/        # Match card UI
└─ lib/
   ├─ api.ts              # createHttpAnalyze → POST /analyze
   ├─ extension-supabase.ts
   ├─ chrome-auth-storage.ts
   ├─ extractor.ts, …
```

## Scripts

```bash
pnpm ext:dev
pnpm ext:build
pnpm --filter @job-fit/extension test
pnpm --filter @job-fit/extension typecheck
```

## Load unpacked

1. `pnpm ext:build`
2. `chrome://extensions` → Developer mode → **Load unpacked** →
   `apps/extension/build/chrome-mv3-prod/`
3. Set `VITE_CHROME_EXTENSION_ID` in the repo root `.env.local` to that
   extension’s id, restart `pnpm web:dev`, sign in on the web app, then open a
   LinkedIn job and click **Check match score**
