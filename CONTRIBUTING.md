# Contributing / Coding Standards

This document captures the conventions applied across the monorepo. Read it before your first change.

## Hard rules

- **Max 500 lines per file.** Split by responsibility well before you hit the limit.
- **No `any`.** Use `unknown` + narrowing, generics, or Zod at boundaries.
- **No default exports** (enforced by Biome), except framework files that require it.
- **Zod at every I/O boundary** — HTTP, storage, browser messaging, env parsing.
- **Conventional Commits** — `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `perf:`.

## Folder conventions

Each app/package follows:

```
src/
  <feature>/            # Feature-scoped modules, colocated tests
    foo.ts
    foo.test.ts
  lib/                  # Cross-feature utilities
  types/                # Shared ambient types only (prefer per-feature types)
  index.ts              # Thin barrel — re-exports only, no logic
```

- Max 3 levels of folder nesting inside `src/`.
- One responsibility per file. If a file exports more than ~5 unrelated things, split it.
- Tests colocate with their unit: `foo.ts` + `foo.test.ts`.

## Naming

- Files: `kebab-case.ts` (e.g. `analyze-service.ts`).
- React components: `PascalCase.tsx` with the exported component matching the filename.
- Types / classes: `PascalCase`. Functions / variables: `camelCase`. Constants: `SCREAMING_SNAKE` only for true compile-time constants.
- Zod schemas: `FooSchema`; derived type: `export type Foo = z.infer<typeof FooSchema>`.

## TypeScript

Root `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`.

- Use `readonly` for public types unless mutation is the explicit contract.
- Prefer `type` over `interface` for non-extendable shapes.
- Narrow early, never cast (`as`) without a type guard above it.

## Errors & logging

- Throw typed `Error` subclasses from domain code (e.g. `AuthError`, `LlmError`).
- Top-level handlers (HTTP handler, extension message bus) translate errors into serialized responses.
- Backend uses `pino` (structured JSON). Extension uses a scoped logger gated on a debug flag.

## Dependencies

- Justify new deps in the PR description.
- Prefer stdlib or platform APIs (Fetch, `URL`, `AbortController`) over wrappers.
- Pin exact versions in leaf apps (`apps/*`); caret ranges in libs (`packages/*`).

## Scripts (from repo root)

| Command | Purpose |
| --- | --- |
| `pnpm -r build` | Build every package that exposes a `build` script |
| `pnpm typecheck` | Run TypeScript across the workspace |
| `pnpm test` | Run Vitest across the workspace |
| `pnpm lint` | Biome lint the repo |
| `pnpm check` | Biome lint + format + write fixes |
| `pnpm check:ci` | Biome lint + format without writing (CI mode) |

A pre-commit hook (`husky` + `lint-staged`) runs `biome check --write` on staged files.

## Commit style

Conventional Commits. Keep the subject <=72 chars, imperative mood.

Examples:

```
feat(backend): POST /analyze with JWT verify and Zod-validated LLM response
fix(extension): fall back to data-testid when class-based selector is missing
refactor(shared): extract prompt builder into its own module
```
