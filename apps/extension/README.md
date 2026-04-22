# @job-fit/extension

Chrome extension (Manifest V3, Plasmo + React 18) that reads LinkedIn job pages
and will score them against the user's saved preferences.

## Phase 6 scope

This is the **DOM-reading scaffold only**. There is no backend call, no "Check
Match Score" button, and no auth handoff yet — those land in Phase 7 and 8.

What ships now:

- Content script injected on `https://www.linkedin.com/jobs/*`
- Resilient job extractor with selector fallbacks for both the
  `job-details-jobs-unified-top-card` (modern) and `jobs-unified-top-card`
  (legacy) layouts
- `createJobContextWatcher` — combines history `pushState` / `replaceState` /
  `popstate` interception with a debounced `MutationObserver` so we re-extract
  every time the user navigates between jobs
- Proof-of-life overlay (`OverlayShell`) rendered via Plasmo CSUI (Shadow DOM)
  just above the job detail pane; it reports the detected title, company and
  location to confirm the pipeline works
- Extraction results are logged to the page console with the `[Job Fit]` tag

## Layout

```
apps/extension/
├─ src/
│  ├─ contents/linkedin.tsx       # Plasmo CSUI entry (mounts on LinkedIn)
│  ├─ components/OverlayShell.tsx # Placeholder overlay (replaced in Phase 7)
│  └─ lib/
│     ├─ extractor.ts             # Pure Document → JobData
│     ├─ selectors.ts             # Ordered CSS selector candidates
│     ├─ observer.ts              # URL + MutationObserver watcher
│     ├─ text.ts                  # Whitespace / location helpers
│     ├─ url.ts                   # LinkedIn job URL parsing
│     ├─ logger.ts                # [Job Fit] console wrapper
│     └─ fixtures/                # HTML fixtures used by tests
└─ assets/icon.png
```

Everything in `lib/` is pure and test-covered. `contents/linkedin.tsx` is the
only file that touches live browser globals; it wires `createJobContextWatcher`
to `extractJobData` and feeds results into the overlay.

## Scripts

From the monorepo root:

```bash
pnpm ext:dev     # plasmo dev (watch + hot reload)
pnpm ext:build   # plasmo build → apps/extension/build/chrome-mv3-prod/
```

Or filtered:

```bash
pnpm --filter @job-fit/extension dev
pnpm --filter @job-fit/extension build
pnpm --filter @job-fit/extension typecheck
pnpm --filter @job-fit/extension test
```

Unit tests (jsdom) cover the URL parser, text helpers, extractor against
fixture variants, and the observer using a sandboxed `JSDOM` instance for
`pushState` / `MutationObserver` behaviour.

## Loading the unpacked extension

1. `pnpm ext:build`
2. Open `chrome://extensions`
3. Toggle **Developer mode** (top right)
4. Click **Load unpacked** and select
   `apps/extension/build/chrome-mv3-prod/`
5. Visit any LinkedIn job URL, for example:
   - `https://www.linkedin.com/jobs/view/4005991234/`
   - `https://www.linkedin.com/jobs/search/?currentJobId=4005991234`

You should see:

- A small "Job Fit" card rendered above LinkedIn's job detail header
- `Detected: <title> · <company> · <location>.` once extraction succeeds
- `[Job Fit]` info logs in DevTools for every `initial`, `url`, and `dom`
  trigger, e.g. when clicking a different job in the list

If you see `Could not read this job yet: <reason>`, LinkedIn's DOM shape has
drifted — add the new classes to `src/lib/selectors.ts` and copy a fresh
fixture into `src/lib/fixtures/` to lock in coverage.

## Manifest

Plasmo generates the MV3 manifest from `package.json.manifest` plus the
content script's `config` export. The built manifest limits permissions to:

- `host_permissions`: `https://*.linkedin.com/*`
- `permissions`: `storage` (reserved for Phase 8 auth token cache)

No broad host permissions, no tab spying, no analytics.
