# Job Fit Extension

A Chrome extension that augments LinkedIn job pages with a real-time, LLM-driven fit analysis tailored to saved user preferences.

## Repo layout

```
apps/
  extension/   # Plasmo + React Chrome extension (LinkedIn content script + widget)
  backend/     # Fastify POST /analyze — stateless LLM proxy with JWT auth
  web/         # Vite + React + shadcn/ui — preferences UI (Supabase auth)
packages/
  shared/      # Shared TS types + Zod schemas + prompt builder
  llm/         # Provider-agnostic LLM adapter (OpenAI / Anthropic / Groq)
```

## Status

- Phase 1: Monorepo scaffolding + shared schemas — **done**
- Phase 2: LLM adapter (OpenAI/Anthropic/Groq) — **done**
- Phase 3: Supabase `user_preferences` + RLS — **done**
- Phase 4: Fastify `POST /analyze` with JWT + LLM — **done**
- Phase 5: Vite + shadcn preferences web app with Supabase auth — **done**
- Phase 6: Plasmo extension + LinkedIn DOM extraction — pending
- Phase 7: "Check Match Score" button UI — pending
- Phase 8: Extension ↔ backend wiring + auth handoff — pending
- Phase 9: DOM fixture tests + hardening — pending
- Phase 10: README + packaging — pending

See `docs/plan.md` for build order and verification checkpoints.

## Requirements

- Node >= 22
- pnpm >= 10

## Workspace scripts

```bash
pnpm typecheck       # tsc across every package
pnpm test            # all Vitest suites
pnpm check           # biome format + lint with --write
pnpm check:ci        # biome verify (no write)
pnpm verify:rls      # end-to-end RLS policy check against Supabase
pnpm web:dev         # vite dev server for the preferences app
pnpm seed:web-user   # seed a confirmed user for web manual QA
```

