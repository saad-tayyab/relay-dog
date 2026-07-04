# AGENTS.md

This is the repository-level guide for AI coding agents. Treat it as a compact map: follow these instructions, read the linked docs only when relevant, and avoid duplicating long documentation into the prompt.

## Scope And Precedence

- This file applies to the whole repository unless a more local `AGENTS.md` exists in a subdirectory.
- A nested `AGENTS.md` should override this file only for files under that directory.
- Explicit user instructions in the current chat override this file.
- If instructions conflict, choose the safest interpretation and say what you assumed.

## Project Snapshot

- Product: Relay Dog, a Nostr relay inspector and developer toolkit.
- Package name: `relayscope`.
- Runtime and package manager: Bun 1.3.
- Monorepo: Turborepo workspaces.
- Frontend: Svelte 5, Vite, Tailwind CSS v4.
- API: Bun, Hono, Drizzle ORM, PostgreSQL.
- Shared code: TypeScript packages under `packages/`.
- Formatting and linting: Biome.

## Start Here

Read only what is relevant to the task:

- `README.md` for product scope, project structure, setup, and commands.
- `docs/README.md` for the documentation map.
- `docs/architecture/overview.md` before changing system boundaries.
- `docs/architecture/database.md` before changing schema or persistence behavior.
- `docs/api/endpoints.md` before changing API contracts.
- `docs/development/style-guide.md` for TypeScript, Svelte, Tailwind, and accessibility conventions.
- `docs/development/testing.md` for verification expectations.
- `docs/development/environment.md` before adding or changing environment variables.
- `docs/features/nip-reference.md` before changing Nostr/NIP behavior.

## Operating Rules

- Prefer the smallest correct change that matches existing patterns.
- Search before editing; use `rg`/`rg --files` when available.
- Do not rewrite unrelated code, docs, formatting, or lockfiles.
- Do not revert user changes unless explicitly asked.
- Keep docs, examples, and types aligned with code behavior.
- Report any checks you could not run.

## Repository Map

- `apps/web/`: Svelte 5 web app.
- `apps/web/src/components/`: UI components, grouped by feature domain.
- `apps/web/src/lib/composables/`: Svelte 5 composables (e.g., `useRelayInspector`).
- `apps/web/src/lib/stores/`: reactive `.svelte.ts` stores.
- `apps/web/src/utils/`: browser-side utility code.
- `apps/api/`: Bun/Hono REST API.
- `apps/api/src/routes/`: API route modules (aggregated by domain in `relay/`).
- `apps/api/src/lib/`: API utilities, validation helpers, SSRF protection, errors.
- `packages/database/`: Drizzle schema, prepared queries, DB connection (`@relayscope/database`).
- `packages/auth/`: API key auth middleware (`@relayscope/auth`).
- `packages/ui/`: Shared Svelte components — SectionCard, Toast, etc. (`@relayscope/ui`).
- `packages/shared/`: Shared TypeScript types and Zod schemas (split by domain: `nip11`, `relay`, `event`, `directory`, `auth`, `api`).
- `packages/config/env/`: environment parsing and validation.
- `packages/config/tsconfig/`: shared TypeScript configs.
- `docs/`: architecture, API, feature, development, and prompt documentation.

## Commands And Verification

Use Bun commands unless a repo script explicitly says otherwise.

```bash
bun install
bun run dev
bun run build
bun run type-check
bun run lint
bun run lint:fix
```

Database commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

Targeted package checks:

```bash
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/api type-check
bun run --filter @relayscope/shared type-check
bun run --filter @relayscope/web lint
bun run --filter @relayscope/api lint
```

Run the smallest useful check for the change. Before handoff, prefer:

```bash
bun run type-check
bun run lint
bun run build
```

## Coding Rules

- Use TypeScript strict-mode-friendly code.
- Avoid `any`; use `unknown` plus parsing or narrowing for untrusted data.
- Keep shared data contracts in `packages/shared` when both web and API need them.
- Keep environment variable parsing in `packages/config/env`.
- Use Zod schemas for runtime validation at boundaries.
- Use Biome formatting conventions.
- Do not introduce a second formatter, linter, package manager, or test framework without a clear project-level reason.
- Add abstractions only when they remove real duplication or match an established local pattern.

## Frontend Rules

- Use Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`.
- Use `.svelte.ts` files for rune-based stores and composables.
- Prefer existing component patterns in `apps/web/src/components`.
- Use Tailwind utility classes and existing design tokens from `apps/web/src/index.css`.
- Avoid inline styles unless dynamic values make them necessary.
- All new UI must preserve WCAG 2.2 AA expectations from `docs/features/phase-9-accessibility.md`.
- Use native interactive elements: `button`, `a`, `input`, `select`, `textarea`.
- Add labels, `aria-label`, `aria-describedby`, `role="status"`, or `role="alert"` where appropriate.
- Keep touch targets at least 44px where the existing UI pattern requires it.

## API And Data Rules

- Keep route handlers in `apps/api/src/routes/` (grouped by domain).
- Keep database schema in `packages/database/src/schema.ts`.
- Keep database queries in `packages/database/src/queries.ts`.
- Keep auth middleware in `packages/auth/src/index.ts`.
- Generate migrations with Drizzle after schema changes.
- Keep API response and request contracts aligned with `docs/api/endpoints.md`.
- Mutating endpoints should remain protected by API key auth unless a spec explicitly changes that.
- Production must require `API_KEY` and a non-default `DATABASE_URL`.
- Preserve rate limiting and error handling patterns.
- Use structured validation for inputs, query params, route params, and request bodies.

## Security Rules

- Treat relay URLs, NIP-11 documents, Nostr events, headers, query strings, and request bodies as untrusted input.
- Do not weaken SSRF protections in `apps/api/src/lib/ssrf.ts`.
- Do not log private keys, `nsec` values, API keys, auth tokens, or signed secrets.
- Do not expose server-only environment variables to the web app.
- Keep Nostr signing operations client-side unless the feature explicitly requires otherwise.
- Be careful with WebSocket behavior: avoid unbounded reconnect loops, unbounded event storage, and unvalidated relay URLs.
- Preserve CORS and auth behavior when touching API bootstrap code.

## Documentation Rules

- Update docs when behavior, commands, environment variables, API contracts, schema, or feature status changes.
- Prefer linking existing docs over repeating long explanations.
- Keep feature docs under `docs/features/`.
- Keep API documentation under `docs/api/`.
- Keep architecture decisions under `docs/architecture/decisions/`.

## Git Hygiene

- Do not revert user changes unless explicitly asked.
- Do not run destructive commands such as `git reset --hard` or broad file deletion without explicit approval.
- Keep commits, if requested, in Conventional Commit format:

```text
<type>(<scope>): <description>
```

Examples:

```text
feat(web): add relay comparison filters
fix(api): validate relay URL before health check
docs: update deployment environment variables
```
