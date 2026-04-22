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

Phase 1 scaffolding complete. See the plan at `docs/plan.md` for build order and verification checkpoints.

## Requirements

- Node >= 22
- pnpm >= 10

