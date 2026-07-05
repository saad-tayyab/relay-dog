---
title: "📋 Changelog"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 📋 Changelog

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](changelog.md) · [📖 Docs Hub](README.md)

---


All notable changes to Relay Scope are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Conventional Commits](https://conventionalcommits.org).

## [Unreleased]

### Added

#### Web (`@relayscope/web`)
- **Phase 13 shadcn-svelte migration completed**
  - Added `apps/web/components.json` with `$lib`-based aliases and `utils` mapped to `$lib/shadcn/utils` (`style: rhea`)
  - Added app-local shadcn primitive source under `apps/web/src/lib/components/ui/**`
  - Added `apps/web/src/lib/shadcn/utils.ts` (`cn()` helper and utility types)
  - Added shadcn-related dependencies (`bits-ui`, `svelte-sonner`, `clsx`, `tailwind-merge`, `tw-animate-css`, plus CLI-selected supporting deps)

### Changed

#### Web (`@relayscope/web`)
- Added `$lib` alias support in `apps/web/vite.config.ts` and `apps/web/tsconfig.json` while preserving `@`
- Merged shadcn semantic tokens into `apps/web/src/index.css` while preserving Relay Dog accessibility utilities, keyframes, `@source`, and legacy product tokens via non-cyclic `--relay-*` → `--color-*` mapping
- Migrated initial isolated slice (`KeyConverter.svelte`) from `@relayscope/ui` primitives to shadcn primitives (`Card`, `Input`, `Label`, `Button`, `Badge`)
- Migrated additional tool slices: `Nip05Checker.svelte`, `QRCodeGenerator.svelte`
- Removed direct `@relayscope/ui` imports from `apps/web/src/**` by introducing web-local shared compatibility components (`apps/web/src/components/shared/**`) and switching existing consumers
- Removed `@relayscope/ui` from `apps/web/package.json` dependencies
- Re-implemented shared compatibility components to use shadcn primitives (`Card`, `Tabs`, `Spinner`, `Button`, `Empty`) while preserving Relay Dog behavior and accessibility
- Reduced `@relayscope/ui` package exports to a minimal shared surface (`StatusDot`) and moved web-facing shared primitives to app-local ownership
- Switched app-level toast delivery from custom component to shadcn Sonner host
- Migrated additional core forms and actions to shadcn field/control primitives (`Field`, `Input`, `Textarea`, `Button`, `Progress`) for stronger visible Rhea-style consistency
- Migrated directory/nav/event interaction controls to shadcn primitives (including `Checkbox` and semantic button variants)
- Replaced shared `AccessibleTabs` wrapper usage with direct shadcn `Tabs` in core app surfaces and removed the wrapper file
- Removed additional shared compatibility wrappers (`LoadingSpinner`, `ErrorMessage`) after switching call-sites to direct shadcn `Spinner`/`Alert` composition
- Replaced `SectionCard` usage across web call-sites with direct shadcn `Card` composition and removed the wrapper file
- **Design system hardening**: regenerated all 56 UI component groups from latest shadcn-svelte registry (`add --all --overwrite`)
- **Design system hardening**: moved `StatusDot` from `@/components/shared/` to `$lib/components/ui/status-dot/` as proper shadcn-style open-code component
- **Design system hardening**: inlined `EmptyState` wrapper directly into `App.svelte`, eliminated the entire `apps/web/src/components/shared/` directory
- **Design system hardening**: removed `@source "../../../packages/ui/src"` from `index.css` (no longer needed)
- **Design system hardening**: added 40 new shadcn primitives on-demand (dialog, dropdown-menu, tooltip, select, table, sheet, popover, alert-dialog, scroll-area, calendar, command, sidebar, drawer, etc.)
- **Design system hardening**: added biome overrides for shadcn registry code lint compliance

### Documentation

- Updated `docs/features/phase-13-shadcn-svelte-migration.md` status to **Complete** with verification snapshot and final migration notes
- Updated `docs/README.md` feature map/doc status for Phase 13
- Updated `docs/development/style-guide.md` with shadcn migration conventions
- Updated `docs/development/testing.md` with Phase 13 UI migration slice checks
- Updated `docs/features/phase-9-accessibility.md` with shadcn-specific accessibility expectations

## [0.9.1] - 2026-07-04

### Changed

#### API (`@relayscope/api`)
- **Drizzle ORM v1 best practices** — comprehensive upgrade of database layer
  - Switched from `drizzle-orm/postgres-js` to `drizzle-orm/bun-sql` (Bun's native SQL client)
  - Enabled JIT (just-in-time) compiled query mappers via `jit: true` for 25-30% latency reduction
  - Removed unused `defineRelations` block and `relations` import (dead code — RQB not used)
  - Upgraded migration folder format via `drizzle-kit up` (snapshots now version 8)
  - Removed `postgres` npm dependency (no longer needed with bun-sql driver)

### Removed

#### API (`@relayscope/api`)
- Removed `defineRelations()` and relational query builder support from schema (unused)
- Removed `postgres` (postgres.js) driver dependency

### Documentation
- Updated `docs/architecture/database.md` — removed `health_checks` and `monitoring_jobs` from schema docs (legacy tables, no longer managed by Drizzle), added driver section, added `drizzle-kit up` command
- Updated `docs/api/endpoints.md` — updated cascading deletes description
- Updated `docs/development/infrastructure-security.md` — updated data retention table
- Updated `docs/development/deployment.md` — updated retention cron checklist
- Updated `docs/audit/packages.md` — added package change entry

---

## [0.9.0] - 2026-07-01

### Added

#### Web (`@relayscope/web`)
- **Accessibility Foundation (WCAG 2.2 AA)**
  - New `AccessibleTabs` component — WAI-ARIA tabs pattern with arrow key navigation, `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, 44×44px touch targets
  - New `Toast` component — replaces all `window.alert()`/`window.confirm()` with accessible in-app notifications
  - New `createDebounce` composable — prevents firehose of HTTP requests on search input (300ms debounce)
  - New `createClipboard` composable — clipboard API with success/error feedback state
  - Added `prefers-reduced-motion` media query to disable animations for vestibular disorders
  - Added `:focus-visible` ring for keyboard navigation (2px accent outline)
  - Added `.sr-only` utility class for screen-reader-only content
  - Added `.touch-target` utility class for WCAG 2.2 SC 2.5.8 compliance
  - Bumped `text-muted` from oklch 55.4% to 62% for WCAG AA 4.5:1 contrast ratio

### Fixed

#### Web (`@relayscope/web`)
- **Critical: Event publishing completely broken** — Rewrote `useEventComposer.publish()` to use `nostr-tools SimplePool` (was creating orphaned WebSockets, checking status synchronously, returning fake `setTimeout` success)
- **Critical: Event deletion was a no-op** — Wired up `useEventDeleter` to actually send kind 5 events to relay via `SimplePool` (was returning fake `success: true` without transmitting)
- **Critical: `Buffer` crash in browser** — Replaced Node.js `Buffer` API in `keys.ts` with browser-compatible `Uint8Array` and manual hex conversion
- **Critical: NIP-42 auth race condition** — Captured `pendingChallenge` into local variable before async operations in `useNip42Auth.authenticate()` (prevents wrong challenge being signed)
- **Memory leak: `eventIds` Set unbounded** — Capped `eventIds` Set in `relaySocket` at `MAX_EVENTS` with LRU-style eviction
- **Memory leak: WebSocket not closed on error** — Added `ws.close()` in `onerror` handlers in `useLatencyMeasurement` and `useWriteTest`
- **Stale data: Directory search firehose** — Added `AbortController` cancellation and 300ms debounce to `useDirectory.setSearch()`
- **Race condition: Rapid filter changes** — Added request cancellation to `useDirectory.fetchRelays()` to prevent stale responses overwriting fresh data
- All 4 tab interfaces (ToolsSection, PublisherSection, InspectorSection, EventBackup) — Converted to `AccessibleTabs` / WAI-ARIA tabs pattern with keyboard navigation
- All `<label>` elements now properly associated with inputs via `for`/`id` (EventComposer, EventDeleter, TagEditor)
- All error/status containers now have `role="alert"` or `aria-live` (ErrorMessage, ConnectionPanel, InspectorSection, EventInput, VerificationPanel)
- All icon-only buttons now have `aria-label` (Remove ✕, Close ✕, Copy, Edit & Re-publish)
- All toggle buttons now have `aria-expanded` or `aria-pressed` (content expand, nsec show/hide, kind presets)
- All decorative emojis wrapped in `<span aria-hidden="true">` (MobileNav, EventDeleter, EventComposer)
- All copy-to-clipboard buttons now use `createClipboard` composable with success/error feedback
- All `window.alert()`/`window.confirm()` replaced with in-app state-driven UI (EventBackup, EventDeleter)
- ComparisonView converted from CSS grid to semantic `<table>` with `<th>`/`<td>` structure
- EventBackup progress bar now has `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- Quick-pick buttons, Connect/Disconnect, Kind presets, Tag presets, Size selectors — all increased to 44×44px minimum
- Navigation bars (`NavBar`, `MobileNav`) now have `aria-label`, `aria-current="page"`, and arrow key support
- Skip-to-content link added to `App.svelte` for keyboard/screen reader users
- Search form has `role="search"` landmark
- Truncated URLs now have `title` attribute for full text on hover
- `text-[10px]` replaced with `text-xs` (12px minimum) across all components
- NIP-05 input now shows validation hint when identifier doesn't contain `@`
- Backup import now validates each event has required Nostr fields before processing

### Changed
- `useEventComposer.publish()` now uses `nostr-tools SimplePool` instead of manual WebSocket
- `useEventDeleter.deleteEvents()` now uses `nostr-tools SimplePool` instead of mock success
- `PublisherSection` and `ToolsSection` now use `AccessibleTabs` component
- `useEventDeleter.reset()` now properly resets `deleting` flag
- `useWriteTest.runTest()` now has concurrency guard to prevent double-submit

## [0.3.0] - 2026-06-30

### Added

#### Web (`@relayscope/web`)
- **Event Verifier & Inspector (Phase 3)**
  - Client-side Nostr event signature verification (Schnorr via nostr-tools)
  - Event ID verification (SHA-256 of canonical serialization)
  - Tag decoder with human-readable explanations for all standard tag types (e, p, t, d, expiration, relay, alt)
  - Event details panel with hex/npub pubkey display, copy buttons, relative timestamps
  - Color-coded KindBadge component (Metadata, Note, DM, Repost, Reaction, Zap)
  - EventInput with JSON validation, error states, and example event loader
  - 3-column responsive layout: Verification → Details → Tags
  - Empty state with guidance icon
  - New "🔐 Event Verifier" tab in main navigation
  - Added `nostr-tools` 2.23.8 dependency (NIP-01, NIP-19)

### Changed

#### API (`@relayscope/api`)
- **Drizzle ORM v1 RC upgrade**: drizzle-orm 0.45.2 → 1.0.0-rc.4, drizzle-kit 0.31.10 → 1.0.0-rc.4
  - Migrated to `defineRelations()` API (Relational Queries v2)
  - Updated `drizzle()` instantiation to v1 object syntax: `drizzle({ client, relations })`

#### Web (`@relayscope/web`)
- **Svelte 5 + Vite 8 compatibility**: svelte 5.35.0 → 5.56.4, @sveltejs/vite-plugin-svelte 5.0.0 → 7.1.2
  - Fixed Vite 8 Rolldown deprecation warnings
  - Plugin v7 requires Vite 8 and Svelte ≥5.46.4

## [0.2.0] - 2026-06-30

### Changed

#### Web (`@relayscope/web`)
- **React → Svelte 5 migration**: Full rewrite from React 19 to Svelte 5 Runes
  - Replaced React hooks (`useState`, `useEffect`, `useCallback`) with Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
  - Replaced `useRelaySocket` hook with reactive `relaySocket` store (getter-based pattern)
  - Replaced all `.tsx` components with `.svelte` components
  - Added `EventCard.svelte` as extracted component (was inline `memo` in React)
  - Removed React dependencies (react, react-dom, @types/react, @types/react-dom, @vitejs/plugin-react)
  - Added Svelte dependencies (svelte, @sveltejs/vite-plugin-svelte, svelte-check)
  - Bundle size: 77.35 KB JS (26.63 KB gzipped) + 28.34 KB CSS (5.91 KB gzipped)

### Added

#### Web (`@relayscope/web`)
- Live Event Stream (Phase 2)
  - Custom `useRelaySocket` hook: WebSocket connection with auto-reconnect (exponential backoff 1s → 30s)
  - ConnectionPanel: status display, connect/disconnect, event count, EOSE stats, NOTICE messages
  - FilterBuilder: REQ subscription builder (kinds, authors, limit, since/until)
  - EventFeed: auto-scrolling event list with smart scroll behavior
  - EventCard: kind badges (color-coded), pubkey display, relative timestamps, expand/copy JSON
  - Tab toggle between NIP-11 Info and Live Stream views
  - Event deduplication by event.id
  - EOSE detection with historical vs. live event counting
  - NOTICE message capture and display
  - 10s connection timeout

## [0.1.0] - 2026-06-30

### Added

#### Core
- Turborepo monorepo setup with Bun workspaces
- Shared types package (`@relayscope/shared`)
- PostgreSQL database with Drizzle ORM
- Git hooks: pre-commit (type-check), commit-msg (conventional commits)

#### API (`@relayscope/api`)
- Hono HTTP server on port 3001
- Relay CRUD endpoints (`GET/POST/PUT/DELETE /api/relays`)
- Health check endpoints (HTTP, CORS, WebSocket)
- NIP-11 automatic fetch on relay creation
- Background relay monitor job (60s interval)
- Drizzle schema: relays, relay_info_snapshots, health_checks, relay_events, monitoring_jobs

#### Web (`@relayscope/web`)
- Vite + Svelte 5 + Tailwind v4
- NIP-11 relay profile viewer
- URL input with auto-completion
- Quick-pick buttons for 7 popular relays
- NIP badge grid (40+ NIPs with color coding and GitHub links)
- Limitations panel (auth required, payment required, max sizes)
- Connection status checks (HTTP, CORS, WebSocket)
- Latency measurement
- Raw JSON viewer (collapsible)
- Error handling with retry button
- Loading states
- Responsive dark theme

#### Documentation
- Architecture overview with Mermaid diagrams
- Database schema reference with ER diagram
- API endpoint reference (full examples)
- Development setup guide
- Contributing guide
- Code style guide
- Feature specs (Phase 1-3)
- ADR-001: Monorepo with Turborepo + Bun
- ADR-002: Drizzle ORM over Prisma

---
