# AGENTS.md

Repository-level guidance for any AI coding assistant, LLM agent, or automation tool working in this repo. Keep changes minimal, verified, and consistent with existing patterns.

## Agent compatibility

- These instructions are tool-agnostic: follow them whether you are running in a CLI, IDE, web UI, local agent runtime, or automated workflow.
- If your environment does not support a named capability, use the closest available equivalent and report what changed.
- Prefer explicit repo paths and commands over assumptions from your own runtime.

## Scope & precedence

- Applies to the whole repo unless a deeper `AGENTS.md` exists.
- Direct maintainer/user instructions override this file.

## High-value repo facts (current wiring)

- Monorepo: Bun workspaces + Turborepo.
- Runtime/package manager: **Bun 1.3.14** (`packageManager` in root `package.json`).
- API entrypoints:
  - `apps/api/src/app.ts` exports `createApp()` (use this in tests).
  - `apps/api/src/index.ts` starts Bun server **and** `startNip66Ingestor()`.
- Route mounting:
  - `/api/relays` routes are under `apps/api/src/routes/relay/*` and aggregated in `apps/api/src/routes/relay/index.ts`.
  - Relay submodules are split by concern: `lookup.ts`, `crud.ts`, `health.ts`, `discover.ts`, `popularity.ts`.
  - `/api/directory` is `apps/api/src/routes/directory.ts`.
- Database source of truth is `packages/database/src/{schema,queries,relations}.ts` (not under `apps/api/src/db`).
- Frontend backend calls should go through `apps/web/src/utils/api.ts` (`apiFetch`), not raw `fetch`, to preserve frontend-only mode fallback behavior.
- Web dev uses Vite proxy (`apps/web/vite.config.ts`: `/api` → `http://localhost:3001`); production backend is optional via `VITE_API_URL`.

## Commands that matter

### Root

```bash
bun install
bun run dev
bun run lint
bun run type-check
bun run test
bun run build
```

### Targeted checks (preferred for small changes)

```bash
bun run --filter @relayscope/web lint
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/api lint
bun run --filter @relayscope/api type-check
bun run --filter @relayscope/api test
# focused API test file (from apps/api/)
bun test src/__tests__/health.test.ts
```

### Database

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

`packages/database/drizzle.config.ts` throws when `DATABASE_URL` is missing, so db commands require env to be set.

## Verification order

- Run the narrowest useful checks first (package lint/type-check, or focused API test file).
- Before handoff for cross-cutting changes, use: `bun run type-check && bun run lint` (and `bun run build` when behavior/build wiring changed).

## Testing quirks

- API tests live in `apps/api/src/__tests__`.
- `apps/api/bunfig.toml` preloads `apps/api/src/__tests__/setup.ts` (sets `NODE_ENV=test`, test API key, and fallback `DATABASE_URL`).
- Most API tests mock `@relayscope/database` and `@relayscope/database/queries`; they do not require a running Postgres instance unless a test opts into real DB access.

## Conventions that are easy to miss

- Svelte 5 runes are required; rune-based composables/stores use `.svelte.ts` files.
- Mutating API endpoints should stay behind `requireApiKey` (`@relayscope/auth`) unless explicitly changing auth behavior.
- Keep SSRF protections intact when touching relay/network fetch paths (`apps/api/src/lib/ssrf.ts`).
- Keep shared contracts in `packages/shared` when both web and API consume them.

## CI / hooks expectations

- Pre-commit hook runs: `bunx biome check .` then `bunx turbo type-check`.
- Commit messages are validated against Conventional Commits by `.githooks/commit-msg`.
- CI (`.github/workflows/ci.yml`) runs: install (`--frozen-lockfile`) → lint → type-check → test → build.

## Docs sync rules

- Update docs when you change API contracts, env vars, schema/migrations, or major behavior.
- Prefer editing existing docs in `docs/` over adding new one-off notes.
