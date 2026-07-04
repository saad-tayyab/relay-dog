---
title: "🔍 Structure Audit 2026"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🔍 Structure Audit 2026

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


**Date:** 2026-07-04  
**Auditor:** goose  
**Scope:** Full monorepo structure, component organization, package boundaries, domain alignment

---

## Current Structure

```
relay-dog/
├── apps/
│   ├── web/                          # Svelte 5 frontend
│   │   └── src/
│   │       ├── components/           # ✅ Feature-based subdirectories
│   │       │   ├── auth/
│   │       │   ├── connection/
│   │       │   ├── event/
│   │       │   ├── filter/
│   │       │   ├── inspector/
│   │       │   ├── monitoring/
│   │       │   ├── nav/
│   │       │   ├── nip11/
│   │       │   ├── publisher/
│   │       │   ├── relay/
│   │       │   ├── search/
│   │       │   ├── shared/
│   │       │   ├── tools/
│   │       │   ├── ui/
│   │       │   ├── verifier/
│   │       │   └── EmptyState.svelte # ⚠️ Straggler — should be in ui/
│   │       ├── lib/
│   │       │   ├── composables/      # Svelte 5 rune-based composables
│   │       │   ├── stores/           # Svelte stores
│   │       │   └── utils/
│   │       ├── utils/                # Browser-side utility modules
│   │       ├── App.svelte            # ⚠️ 281 lines — still the god component
│   │       ├── index.css
│   │       └── main.ts
│   └── api/                          # Hono + Bun backend
│       └── src/
│           ├── routes/               # Route modules (flat)
│           ├── db/                   # Schema, queries, connection
│           ├── jobs/                 # Background jobs
│           ├── lib/                  # Shared utilities
│           ├── middleware/           # Auth middleware
│           ├── app.ts                # ✅ Extracted (was inline)
│           └── index.ts              # Entry point
├── packages/
│   ├── shared/                       # Types + Zod schemas
│   ├── config/
│   │   ├── env/                      # Environment validation
│   │   └── tsconfig/                 # Shared TS configs
│   └── (no ui, auth, database)       # ⚠️ Missing domain packages
├── docs/                             # Documentation
├── drizzle/                          # Migrations
└── infra/                            # Infrastructure (empty)
```

---

## Audit Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Monorepo Setup | **9/10** | Turborepo + Bun workspaces, clean task graph |
| Feature-Based Organization | **7/10** | Web components reorganized; API routes still flat |
| Package Boundaries | **6/10** | `shared`, `env`, `tsconfig` exist; missing `ui`, `database`, `auth` packages |
| Domain Alignment | **5/10** | Nostr concepts scattered; no clear domain grouping |
| God Component / File Size | **4/10** | `App.svelte` 281 LOC; `types.ts` 423 LOC; `relays.ts` 326 LOC |
| Separation of Concerns | **6/10** | Composables extracted; but `utils/` is a dumping ground |
| Testing Boundaries | **3/10** | Almost no tests; `__tests__/` dirs are mostly empty |
| Documentation Accuracy | **8/10** | Strong docs; architecture overview is current |
| **Overall** | **6/10** | Good foundation, needs domain refinement |

---

## Findings & Recommendations

### 🔴 Critical

#### 1. `App.svelte` is still a god component (281 LOC)

**Current state:** `App.svelte` owns ALL state, ALL orchestration, ALL data fetching, and ALL navigation. It holds:
- 8 `$state` variables
- 3 composable instances  
- `handleFetch()` with 60+ lines of orchestration logic
- Toast/undo logic with inline `fetch()` calls
- Section routing

**2026 best practice:** The root component should be a thin shell. Each feature section should own its own data fetching and state.

**Recommendation:**
```
App.svelte (thin shell: layout + router)
  └── Each section owns its own state + fetching
      ├── InspectorPage.svelte (self-contained)
      ├── VerifierPage.svelte (self-contained)
      ├── PublisherPage.svelte (self-contained)
      ├── ToolsPage.svelte (self-contained)
      └── DirectoryPage.svelte (self-contained)
```

#### 2. `types.ts` is a 423-line monolith

**Current state:** All shared types live in one file — NIP-11 types, database entity types, DTO types, relay filter types, API response types, discovery types.

**Recommendation:** Split into domain-aligned type modules:
```
packages/shared/src/
├── nip11.ts          # RelayNip11, RelayLimitation, RelayFees
├── relay.ts          # Relay entity, RelayDiscovery, RelayHealthCheck
├── event.ts          # NostrEvent, EventFilter
├── directory.ts      # DirectoryRelay, DirectoryStats
├── api.ts            # ApiResponse<T>, PaginationParams
├── auth.ts           # Nip42Auth types
├── index.ts          # Re-exports
└── schemas.ts        # Zod schemas (keep as-is, already well-organized)
```

### 🟡 Important

#### 3. API routes lack domain grouping

**Current state:**
```
routes/
├── relays.ts      (326 LOC — does too much)
├── directory.ts   (187 LOC)
├── discover.ts    (43 LOC)
└── popularity.ts  (99 LOC)
```

`relays.ts` is 326 lines and handles relay CRUD, health checks, NIP-11 fetching, connection testing, and relay lookup. This violates single responsibility.

**Recommendation:** Group routes by domain:
```
routes/
├── relay/
│   ├── index.ts          # Router aggregator
│   ├── crud.ts           # GET/POST/PUT/DELETE relay
│   ├── health.ts         # POST /:id/check, GET /:id/health
│   ├── lookup.ts         # GET /lookup?url=...
│   └── nip11.ts          # POST /:id/nip11 (or inline in CRUD)
├── directory/
│   ├── index.ts
│   └── relays.ts         # Directory relay management
├── discovery/
│   └── index.ts          # NIP-66 discoveries
└── popularity.ts         # Popularity/leaderboard
```

#### 4. `packages/shared` should be split into domain packages

**Current state:** Everything that's shared between web and API lives in `@relayscope/shared`. This is a catch-all that will grow unbounded.

**2026 trend:** Domain-oriented packages with clear boundaries.

**Recommendation:**
```
packages/
├── shared/                    # Keep: pure Nostr protocol types (NIP-11, events)
│   └── src/
│       ├── nip11/             # NIP-11 types + schemas
│       ├── event/             # Nostr event types + schemas
│       └── index.ts
├── database/                  # New: DB schema, queries, connection
│   └── src/
│       ├── schema.ts          # Move from apps/api/src/db/
│       ├── queries.ts         # Move from apps/api/src/db/
│       ├── index.ts           # Re-export db connection
│       └── package.json       # Deps: drizzle-orm, postgres
├── auth/                      # New: Auth middleware + types
│   └── src/
│       ├── middleware.ts      # Move from apps/api/src/middleware/
│       ├── types.ts
│       └── package.json
└── ui/                        # New: Shared Svelte components
    └── src/
        ├── SectionCard.svelte
        ├── ErrorMessage.svelte
        ├── LoadingSpinner.svelte
        ├── StatusDot.svelte
        ├── AccessibleTabs.svelte
        └── index.ts
```

**Why this matters:**
- API can import `@relayscope/database` without importing web-specific code
- Web can import `@relayscope/ui` for consistent design system
- Clear dependency graph: `api → database → shared`, `web → ui → shared`

#### 5. `utils/` directories are dumping grounds

**Web `utils/` (7 files):**
```
api.ts, backup.ts, keys.ts, nip05.ts, nostrVerify.ts, relay.ts, router.ts
```

**Web `lib/utils/` (1 file):**
```
nostr.ts
```

These serve different purposes (API helpers, Nostr crypto, backup logic, key conversion) but all live in flat `utils/` directories. Some belong in domain packages.

**Recommendation:**
- `relay.ts` → `packages/shared/src/nip11/relay.ts` (shared logic)
- `nostrVerify.ts` → `packages/shared/src/event/verify.ts` (shared)
- `api.ts` → `apps/web/src/lib/api.ts` (app-specific)
- `backup.ts` → `apps/web/src/components/tools/backup.ts` (colocate with consumer)
- `keys.ts` → `apps/web/src/components/tools/keys.ts` (colocate with consumer)
- `nip05.ts` → `apps/web/src/components/tools/nip05.ts` (colocate with consumer)
- `router.ts` → stays (cross-cutting)

#### 6. `EmptyState.svelte` is a straggler

**Location:** `components/EmptyState.svelte` (root level, not in any subdirectory)

**Fix:** Move to `components/ui/EmptyState.svelte`

### 🟢 Nice to Have

#### 7. Composables colocated vs centralized

**Current:** All composables live in `lib/composables/`.

**2026 trend:** Colocate composables with their consuming feature, OR keep centralized if shared across features.

**Analysis:**
- `useAddRelay` → only used by relay/ — could move to `components/relay/`
- `useDirectory` → only used by relay/ — could move to `components/relay/`
- `useEventComposer` → only used by publisher/ — could move to `components/publisher/`
- `useEventDeleter` → only used by publisher/ — could move to `components/publisher/`
- `useRelayDiscovery` → only used by relay/ — could move to `components/relay/`
- `useWriteTest` → only used by App/Inspector — stays centralized
- `useLatencyMeasurement` → only used by App/Inspector — stays centralized
- `useNip42Auth` → only used by Inspector — stays centralized
- `useToast` → used by App — stays centralized
- `useCopyToClipboard` → used by tools/ — could move to `components/tools/`

**Hybrid approach:** Keep shared composables centralized, colocate feature-specific ones.

#### 8. Missing test infrastructure

**Current state:** `apps/api/src/__tests__/setup.ts` (17 lines), `packages/shared/src/__tests__/schemas.test.ts` (104 lines). That's it.

**2026 best practice:** Each package should have co-located tests.

**Recommendation priority:**
1. API route integration tests (most critical — these are the data integrity layer)
2. Shared schema validation tests (already started)
3. Composable unit tests
4. Component E2E tests (lowest priority for this project)

#### 9. No `packages/ui` design system

The web app has `components/ui/` with 4 generic components (`SectionCard`, `ErrorMessage`, `LoadingSpinner`, `StatusDot`) and `components/shared/` with 2 (`AccessibleTabs`, `Toast`).

**Recommendation:** Extract these into a `packages/ui` package for potential reuse across web + mobile (if mobile is planned per the directory structure hint).

---

## Prioritized Action Plan

### Phase A: Quick Wins (1-2 hours)
1. ✅ ~~Component directory restructure~~ — DONE
2. ✅ ~~API app.ts extraction~~ — DONE
3. Move `EmptyState.svelte` → `components/ui/`
4. Fix `EmptyState.svelte` import in `App.svelte`

### Phase B: Type Organization (2-3 hours)
1. Split `types.ts` into domain modules: `nip11.ts`, `relay.ts`, `event.ts`, `directory.ts`, `api.ts`
2. Update `schemas.ts` imports to match
3. Update all consumers

### Phase C: API Route Refactoring (3-4 hours)
1. Split `routes/relays.ts` (326 LOC) into domain modules
2. Create route aggregators per domain
3. Extract relay lookup + health check into separate route files

### Phase D: Package Boundary Refinement (4-6 hours)
1. Create `packages/database/` — extract schema + queries + connection
2. Create `packages/auth/` — extract auth middleware
3. Create `packages/ui/` — extract shared Svelte components
4. Update imports across all packages

### Phase E: App.svelte Decomposition (3-4 hours)
1. Extract `handleFetch()` logic into a composable (`useRelayInspector`)
2. Extract `handleInDirectoryChange` into a composable
3. Create per-section page components
4. Leave `App.svelte` as a thin shell (~80 LOC max)

### Phase F: Testing Foundation (ongoing)
1. Add API route tests
2. Add composable tests
3. Set up CI test pipeline

---

## Comparison: Current vs Target State

### Current
```
packages/
├── shared/        # Everything shared (423 LOC types.ts)
├── config/env/
└── config/tsconfig/

apps/
├── web/src/components/  # Feature dirs ✅
│   ├── tools/          # Tools colocated ✅
│   ├── relay/          # Relay colocated ✅
│   └── EmptyState.svelte  # Straggler ⚠️
├── web/src/App.svelte  # God component (281 LOC) ⚠️
└── api/src/routes/     # Flat route files ⚠️
```

### Target (2026 Best Practices)
```
packages/
├── shared/             # Protocol types only (NIP-11, events)
│   ├── nip11/
│   ├── event/
│   └── index.ts
├── database/           # Schema + queries + connection
│   ├── schema.ts
│   ├── queries.ts
│   └── index.ts
├── auth/               # Auth middleware + types
│   ├── middleware.ts
│   └── types.ts
├── ui/                 # Shared Svelte components
│   ├── SectionCard.svelte
│   ├── ErrorMessage.svelte
│   ├── LoadingSpinner.svelte
│   ├── StatusDot.svelte
│   ├── AccessibleTabs.svelte
│   ├── Toast.svelte
│   └── index.ts
└── config/
    ├── env/
    └── tsconfig/

apps/
├── web/src/
│   ├── components/     # Feature-based ✅ (already done)
│   │   ├── inspector/
│   │   ├── relay/
│   │   ├── publisher/
│   │   ├── verifier/
│   │   ├── tools/
│   │   └── ...
│   ├── pages/          # Thin page wrappers
│   │   ├── InspectorPage.svelte
│   │   ├── VerifierPage.svelte
│   │   ├── PublisherPage.svelte
│   │   └── DirectoryPage.svelte
│   ├── lib/
│   │   └── composables/  # Only shared composables
│   ├── App.svelte       # Thin shell (~80 LOC)
│   └── main.ts
└── api/src/
    ├── routes/
    │   ├── relay/
    │   ├── directory/
    │   ├── discovery/
    │   └── popularity/
    ├── db/              # Will move to packages/database
    ├── middleware/       # Will move to packages/auth
    └── jobs/
```

---

## Dependency Graph (Target)

```
┌─────────────┐
│ @relayscope │
│   shared     │  Protocol types, Zod schemas
└──────┬──────┘
       │
┌──────┴──────┐
│ @relayscope │
│  database    │  DB schema, queries, connection
└──────┬──────┘
       │
┌──────┴──────┐
│ @relayscope │
│    auth      │  Auth middleware, API key validation
└──────┬──────┘
       │
┌──────┴──────┐    ┌─────────────┐
│ @relayscope │    │ @relayscope │
│    api       │    │     ui      │
│  Hono routes │    │ Svelte comp │
└─────────────┘    └──────┬──────┘
                          │
                   ┌──────┴──────┐
                   │ @relayscope │
                   │    web      │
                   │  Svelte app │
                   └─────────────┘
```

---

## What's Already Good ✅

1. **Turborepo + Bun workspaces** — Modern, fast, correct choice
2. **Component feature directories** — `auth/`, `connection/`, `event/`, `relay/`, `publisher/`, `verifier/`, `tools/`, `ui/` — well organized
3. **Composable pattern** — Svelte 5 runes with `.svelte.ts` files
4. **API app.ts extraction** — Enables testing and clean separation
5. **Zod schemas in shared** — Runtime validation at boundaries
6. **Environment validation package** — `@relayscope/env` is correctly isolated
7. **Shared TypeScript configs** — `@relayscope/tsconfig` prevents config drift
8. **Documentation** — Thorough architecture docs, API docs, feature specs
9. **Biome** — Fast, modern formatter/linter
10. **Security posture** — SSRF protection, rate limiting, CSP headers

---
