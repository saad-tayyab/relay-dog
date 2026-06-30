# 📋 Changelog

All notable changes to Relay Scope are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Conventional Commits](https://conventionalcommits.org).

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
