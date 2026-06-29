# 📋 Changelog

All notable changes to Relay Scope are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Conventional Commits](https://conventionalcommits.org).

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
- Vite + React 19 + Tailwind v4
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
