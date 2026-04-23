# RoleGauge — deployment (Vercel → Railway → Chrome Web Store)

Do these **in order**. After each phase, run the **manual tests** before continuing.

**Prerequisites:** Supabase project (URL + keys), LLM API key(s), GitHub repo connected to Vercel and Railway.

---

## Phase 1 — Frontend on Vercel

### 1.1 Create the project

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import this GitHub repo.
2. **Root Directory:** leave as **`.`** (repository root) so pnpm workspace installs correctly.
3. Vercel should pick up the root `vercel.json` (`outputDirectory: apps/web/dist`, custom build). If the dashboard still asks:
   - **Install Command:** `pnpm install`
   - **Build Command:** `pnpm --filter @job-fit/shared build && pnpm --filter @job-fit/web build`
   - **Output Directory:** `apps/web/dist`
4. **Node:** use **22.x** (see root `package.json` `engines`).

### 1.2 Environment variables (Vercel → Project → Settings → Environment Variables)

Set for **Production** (and Preview if you want PR previews to work):

| Name | Example / notes |
|------|------------------|
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` in Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase **anon** / publishable key. |
| `VITE_BACKEND_URL` | For Phase 1 manual checks you can use your **local** API (`http://localhost:3000`) *only* if you understand browser mixed-content/CORS limits; for real prod use the **Phase 2 Railway URL** after the API is live. |
| `VITE_CHROME_EXTENSION_ID` | Optional until the extension is in the store; can be empty, then set after you have an ID. |

The Vite app also reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` from env if the `VITE_*` variants are missing (see `apps/web/vite.config.ts`).

### 1.3 Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL configuration**:

- **Site URL:** `https://<your-vercel-domain>` (e.g. `https://rolegauge.vercel.app`)
- **Redirect URLs:** add the same origin (and `http://localhost:5173` for local dev if you use it)

Redeploy Vercel after changing env vars.

### 1.4 Manual tests (Phase 1 — do not start Phase 2 until these pass)

- [ ] Open the **production** Vercel URL; page loads with **RoleGauge** title and no blank screen.
- [ ] **Sign in** (or sign up) works; no Supabase CORS/URL errors in the browser **Console**.
- [ ] **Preferences** form loads and **Save** succeeds (or you see a clear, expected error if the backend is not deployed yet).
- [ ] If `VITE_BACKEND_URL` still points to localhost, expect analyze-related flows from the **web** app only where applicable; full end-to-end scoring is validated after the API is live (Phase 2).

**Stop here** until Phase 1 is green, then set `VITE_BACKEND_URL` to the Railway URL and redeploy after Phase 2.

---

## Phase 2 — Backend on Railway

### 2.1 Create the service

1. [Railway](https://railway.com) → **New** → **GitHub repo** → select the same repository.
2. **Single service** for the API. The repo includes **`railway.json`** at the root (build + start + `/health` healthcheck). Railway merges this with the dashboard.
3. Confirm **Start command** in the deploy summary: `node apps/backend/dist/server.js`.
4. **Do not** set the service root to `apps/backend` only — the monorepo build must run from the **repository root** so workspace packages build.

### 2.2 Environment variables (Railway → Variables)

| Name | Required | Notes |
|------|----------|--------|
| `NODE_ENV` | recommended | `production` |
| `PORT` | auto | Railway sets this; `config` already uses `PORT`. |
| `BACKEND_HOST` | optional | Default `0.0.0.0` is fine. |
| `SUPABASE_URL` | yes | |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Same publishable/anon key as the web app. |
| `LLM_PROVIDER` | yes | e.g. `openai` |
| `LLM_MODEL` | optional | |
| `OPENAI_API_KEY` or provider key | as needed | Per `packages/llm`. |
| `BACKEND_CORS_ORIGINS` | **yes** | Comma-separated, **no spaces** (or match your parser). **Must include:** your **Vercel origin** (e.g. `https://xxx.vercel.app`), **`https://www.linkedin.com`**, **`https://linkedin.com`**, and your **`chrome-extension://<id>`** once you have an extension ID. |
| `BACKEND_LOG_LEVEL` | optional | e.g. `info` |

Redeploy after saving variables.

### 2.3 Connect Vercel to the API

1. Copy the **public Railway URL** (e.g. `https://rolegauge-api.up.railway.app`).
2. In **Vercel** → set `VITE_BACKEND_URL` to that URL (include `https://`, no trailing slash).
3. Redeploy the **frontend** on Vercel.

### 2.4 Manual tests (Phase 2)

- [ ] `GET https://<railway-url>/health` returns `{"status":"ok"}`.
- [ ] With a valid **Supabase JWT** (e.g. from the web app session), `POST /analyze` works or returns a structured error (e.g. missing prefs), not a CORS failure.
- [ ] **LinkedIn** is not testable from `curl` alone; after Phase 3, test scoring from the extension on a job page.
- [ ] On **Vercel**, sign in → save preferences → confirm no new console errors.
- [ ] (Optional) Run `pnpm --filter @job-fit/backend smoke` locally against the Railway base URL if you have smoke env vars set up.

**Stop here** until health + CORS are good, then Phase 3.

---

## Phase 3 — Chrome Web Store (extension)

### 3.1 Production build and zip

1. In **`apps/extension/package.json`**, set **`manifest.host_permissions`**, **`manifest.externally_connectable.matches`**, and any **`permissions`** to your **real** Vercel + Railway + Supabase hosts (rebuild every time you change them).
2. **Env:** create/update `apps/extension/.env` with production `PLASMO_PUBLIC_*` (especially `PLASMO_PUBLIC_WEB_APP_URL` = your Vercel site, `PLASMO_PUBLIC_BACKEND_URL` = Railway API).
3. From repo root:

   ```bash
   pnpm ext:build
   pnpm --filter @job-fit/extension package
   ```

4. The packaged zip is usually under `apps/extension/build` (Plasmo may also emit a `.zip` in the package output — use the file Chrome Web Store asks for).

### 3.2 Developer Dashboard

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Add new item** → upload the zip.
2. Fill **store listing** (name **RoleGauge**, description, screenshots, privacy — single purpose, data usage, “not affiliated with LinkedIn” as appropriate).
3. **Privacy policy URL** and justification for `host_permissions` / `externally_connectable` are required; align them with your actual code.

### 3.3 After publication

1. Note the **extension ID** from `chrome://extensions` (or the developer item page).
2. Set **`VITE_CHROME_EXTENSION_ID`** on Vercel and redeploy the web app.
3. Update **Supabase** if needed for any auth redirect edge cases.
4. Ensure **Railway** `BACKEND_CORS_ORIGINS` includes `chrome-extension://<that-id>`.

### 3.4 Manual tests (Phase 3)

- [ ] Install the **from-store** (or unlisted) build; open RoleGauge **popup** / prefs link goes to **Vercel** URL.
- [ ] **Sign in** on the web app; session handoff to the extension works (`externally_connectable` + `VITE_CHROME_EXTENSION_ID`).
- [ ] On a LinkedIn **job** page, run **Check match score**; result or a clear in-card error (not a generic CORS/network failure if everything is configured).

---

## Rollback / debugging

- **Vercel build fails:** run `pnpm --filter @job-fit/shared build && pnpm --filter @job-fit/web build` locally.
- **Railway build fails:** run the same filter chain with `... && pnpm --filter @job-fit/llm build && pnpm --filter @job-fit/backend build` locally.
- **CORS:** always check `BACKEND_CORS_ORIGINS` **exact** origins (scheme + host, no path).
- **Extension “network” on LinkedIn:** add LinkedIn origins to CORS; see Phase 2 table.

---

## One-line summary

1. **Vercel** = static web + env → manual UI/auth tests.  
2. **Railway** = API + CORS + `VITE_BACKEND_URL` on Vercel → `/health` + API tests.  
3. **Chrome Web Store** = package zip + listing → extension ID → Vercel + CORS + extension manual test on LinkedIn.
