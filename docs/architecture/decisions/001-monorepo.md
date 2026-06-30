# ADR-001: Monorepo with Turborepo + Bun

## Status

**Accepted** — 2026-06-30

## Context

Relay Scope requires a web frontend (Svelte 5), a backend API (Hono), and shared types. We need a structure that:

- Shares TypeScript types between frontend and backend without duplication
- Enables fast local development with hot reload across packages
- Scales to additional packages (shared UI components, CLI tools, etc.)
- Minimizes build times as the codebase grows

## Decision

We adopt a **Turborepo monorepo** with **Bun** as the runtime and package manager.

### Package Layout

```
relayscope/
├── apps/
│   ├── web/          # Vite + Svelte 5
│   └── api/          # Hono + Bun + Drizzle
├── packages/
│   └── shared/       # TypeScript types only
├── turbo.json
└── package.json      # Bun workspaces root
```

### Why Not Alternatives

| Alternative | Why Not |
|-------------|---------|
| **Separate repos** | Type sharing requires publishing a package; no atomic commits across frontend/backend |
| **Nx** | Heavier learning curve, less Bun-native support, slower for small projects |
| **pnpm workspaces** | Great, but Bun is faster and we already use it as the runtime |
| **Lerna** | Legacy tool, Turborepo supersedes it |
| **Single package** | No separation of concerns; frontend bundles server code |

## Consequences

### Positive

- **Type safety**: `@relayscope/shared` is imported by both `web` and `api`, catching type mismatches at build time
- **Atomic commits**: A single commit can update the API schema, shared types, and the frontend that consumes them
- **Incremental builds**: Turborepo only rebuilds packages that changed (`turbo build` with caching)
- **Parallel dev**: `turbo dev` starts both web and API simultaneously
- **Workspace protocol**: `bun install` resolves `workspace:*` dependencies locally

### Negative

- **CI complexity**: Need to install all packages even if only one changed (mitigated by Turbo caching)
- **Bundle size awareness**: Must ensure `shared` doesn't accidentally import heavy dependencies
- **Learning curve**: Team members unfamiliar with monorepo tooling

## References

- [Turborepo docs](https://turbo.build)
- [Bun workspaces](https://bun.sh/docs/install/workspaces)
- [When to use monorepos](https://turbo.build/repo/docs/getting-started/create-monorepo)
