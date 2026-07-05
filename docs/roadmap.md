---
title: "🗺️ Roadmap"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🗺️ Roadmap

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](changelog.md) · [📖 Docs Hub](README.md)

---


Relay Dog is built in phases, each delivering standalone value while building toward a complete Nostr developer toolkit.

## Status

```
Phase 1  ████████████████████  NIP-11 Viewer (MVP)              ✅ Done
Phase 2  ████████████████████  Live Event Stream                 ✅ Done
Phase 3  ████████████████████  Event Verifier & Inspector        ✅ Done
Phase 4  ████████████████████  Auth & Health Dashboard           ✅ Done
Phase 5  ████████████████████  Relay Directory & Comparison      ✅ Done
Phase 6  ████████████████████  Security Hardening                ✅ Done
Phase 7  ████████████████████  NIP Compliance & Modernization    ✅ Done
Phase 8  ████████████████████  Developer Toolkit Expansion       ✅ Done
Phase 9  ████████████████████  WCAG 2.2 AA Accessibility          ✅ Done
Phase 10 ████████████████████  Infrastructure Hardening             ✅ Done
Phase 11 ░░░░░░░░░░░░░░░░░░░░  Production Deployment (Fly.io)      📋 Planned
Phase 12 ████████████████████  NIP-66 Passive Monitoring           ✅ Done
```

## Phase 1: NIP-11 Viewer (MVP) ✅

> *Weekend 1*

Fetch and beautifully render a relay's NIP-11 info document. This is the MVP — shippable and useful on its own.

**What ships:**
- URL input with auto-completion and quick-pick buttons
- NIP-11 fetch with `Accept: application/nostr+json`
- Relay profile: name, description, icon, software, version
- NIP badge grid (40+ NIPs, color-coded, links to specs)
- Limitations panel: max message size, max subs, auth/payment required
- Connection status: HTTP reachable, CORS configured, WebSocket connectable
- Latency measurement
- Raw JSON viewer (collapsible)
- Error handling with retry

**NIPs**: NIP-11

---

## Phase 2: Live Event Stream 🚧

> *Weekends 2–3*

Connect over WebSocket and stream events in real time. The heart of the debugger — watch what's actually flowing through the relay.

**What ships:**
- WebSocket connection with real-time status indicator (connecting/connected/disconnected/error)
- Auto-reconnect with exponential backoff
- REQ subscription builder — filter by kinds, authors, tags, time range
- Live event feed with kind labels (kind 1 = note, kind 0 = metadata, etc.)
- Raw JSON expandable view for each event
- EOSE detection — show when historical backfill is complete
- NOTICE and error message display
- Copy event JSON button

**NIPs**: NIP-01 (core), NIP-11 (done)

**New dependencies**: None (WebSocket is browser-native)

---

## Phase 3: Event Verifier & Inspector 📋

> *Weekend 4*

For any event, verify its signature, decode its fields, and explain what it means. Makes your tool useful for debugging broken events.

**What ships:**
- Paste any event JSON → verify Schnorr signature client-side
- Decode pubkey → npub format, link to profile
- Explain each tag (e, p, t, a tags decoded with context)
- Show event ID verification (SHA-256 of canonical serialization)
- NIP-05 identifier check for the author
- Event kind explanations

**NIPs**: NIP-01 (event structure), NIP-05 (DNS identity), NIP-19 (bech32 encoding)

**New dependencies**: `@noble/curves`, `@noble/hashes`, `@scure/base`

---

## Phase 4: Auth & Health Dashboard 📋

> *Weekends 5–6*

Handle auth-required relays and add latency/health metrics. This is the hardest feature and the one that sets your tool apart.

**What ships:**
- NIP-42 AUTH challenge handling via NIP-07 browser extension
- Connection latency measurement (WebSocket round-trip timing)
- EOSE timing — how long the relay takes to deliver historical events
- Write test: publish a test event and confirm OK response
- Fee display for paid relays (admission, subscription, per-event)
- Auth status indicator (authenticated / auth required / anonymous)

**NIPs**: NIP-42 (relay auth), NIP-07 (browser extension), NIP-11 (limitations)

**New dependencies**: NIP-07 provider detection

---

## Phase 5: Relay Directory & Comparison 📋

> *Weekends 7–9*

Go from a single-relay inspector to a directory. Users can browse known relays, filter by supported NIPs, and compare two relays side by side.

**What ships:**
- NIP-66 powered relay discovery — pull known relays from monitor events
- Filter by: supported NIPs, free/paid, auth required, country
- Side-by-side comparison view for two relays
- Historical uptime sparklines (if you persist liveness data)
- Shareable permalink per relay: `yourapp.com/relay/relay.nos.lol`

**NIPs**: NIP-65 (relay list events), NIP-66 (relay monitoring), NIP-11 (done)

**New dependencies**: None

---

## Phase 6: Security Hardening ✅

> *Post Phase 5 audit*

Full-stack security hardening required before any internet-facing production deploy.

**What ships:**
- API key auth on mutating routes (`POST`, `PUT`, `DELETE`, health check trigger)
- SSRF protection on all server-side relay URL fetches
- PUT mass assignment fix with Zod field whitelist
- Rate limiting (20 write / 200 read req/min per IP)
- Docker hardening (localhost bind, env password, healthcheck, resource limits)
- Production error handler with sanitized health check messages
- Security headers (HSTS, CSP, Permissions-Policy) on API and SPA
- Zod input validation on relay create/update
- CI dependency scanning (`bun audit` + OSV Scanner)
- Frontend: https-only relay icons, NIP-42 challenge validation

**NIPs**: N/A (infrastructure and API security)

**New dependencies**: `zod`, `@hono/zod-validator`, `hono-rate-limiter`

**Removed dependencies**: `node-cron` (unused)

---

## Phase 7: NIP Compliance & Protocol Modernization ✅

> *Weekend 10–11*

Bring relay-dog in line with the latest NIP specs (June 2026). Fix outdated types, implement missing protocol features, and add NIP validation schemas in the **shared package** (API DTO schemas already shipped in Phase 6).

**What ships:**
- Updated NIP-11 types with all current fields (banner, pubkey, fees, etc.)
- NIP-66 relay discovery — consume kind:30166 events from monitors (Phase 5 spec was not implemented)
- NIP-67 EOSE completeness hints — show "all events received" vs. "more available"
- NIP-65 relay list display — show read/write popularity per relay
- NIP-50 search filter — forward `search` to relays that support it (directory ILIKE already exists)
- NIP-40 expiration — expired event indicators
- NIP-42 auth hardening — OK/CLOSED prefix display, auth status badge
- Zod NIP schemas in `packages/shared` (consolidation of API DTO schemas from Phase 6)
- Deprecated incorrect types (FeeInfo, posting_limit, relay_limitation)

**NIPs**: NIP-11 (updated), NIP-40, NIP-42 (display/timing), NIP-50, NIP-65, NIP-66 (integrated), NIP-67

**New API endpoints**: `GET/POST /api/relays/:id/discoveries`, `GET/POST /api/relays/:id/popularity`

**New dependencies**: `zod` in `packages/shared` (already in `apps/api` from Phase 6)

---

## Phase 8: Developer Toolkit Expansion ✅

> *Weekends 12–14*

Expand from a relay inspector into a complete Nostr developer toolkit. Add six standalone tools plus a restructured navigation.

**What ships:**
- **Key Converter** — npub ↔ nsec ↔ hex with safety warnings
- **NIP-05 Checker** — standalone identity verification with DNS resolution
- **QR Code Generator** — QR codes for npub keys, relay URLs, events
- **Event Publisher** — compose, sign (NIP-07), and publish events to any relay
- **Event Deleter** — mass-delete events via NIP-09 kind 5
- **Event Backup & Restore** — export/import events as JSON with signature verification
- **App Navigation Restructure** — section-based nav (Inspector, Verifier, Publisher, Tools, Directory)

**NIPs**: NIP-01, NIP-05, NIP-07, NIP-09, NIP-19

**New dependencies**: `qrcode` (client-side QR generation)

**Feature doc**: [phase-8-developer-toolkit.md](features/phase-8-developer-toolkit.md)

---

## Phase 10: Infrastructure Hardening & DevSecOps ✅

> *Day 16*

Comprehensive infrastructure security audit and remediation following NIST SP 800-204D, CIS Docker Benchmarks, and CISA SCuBA standards. Addresses all findings from the July 2026 security audit across GitHub Actions, Docker, SSRF protection, CI/CD pipeline, and deployment configuration. **Deploy blocker** — required before any internet-facing production launch.

**What ships:**
- **GitHub Actions supply chain hardening** — all actions pinned to full SHA, explicit `permissions` blocks, OSV scanner pinned with checksum verification
- **Docker CIS benchmark compliance** — `security_opt: no-new-privileges`, `cap_drop: ALL` with selective `cap_add`, `tmpfs` mounts
- **`.dockerignore`** — prevents secrets and build artifacts from leaking into Docker build context
- **SSRF DNS rebinding fix** — `assertSafeUrlResolved()` validates resolved IP against private ranges
- **Health check DB verification** — `/api/health` returns 503 if PostgreSQL is unreachable
- **Data retention cron** — daily cleanup: health_checks (90d), relay_events (30d), snapshots (180d)
- **Structured logging** — JSON-formatted logs for log aggregator compatibility
- **CI test step** — `bun test` added to GitHub Actions pipeline
- **Infrastructure security best practices doc** — `docs/development/infrastructure-security.md`

**Standards:** NIST SP 800-204D, CIS Docker Benchmarks 4.x/5.x, CISA SCuBA CI/CD

**Files changed:** `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `docker-compose.yml`, `.dockerignore` (new), `apps/api/src/lib/ssrf.ts`, `apps/api/src/index.ts`, `apps/api/src/jobs/relayMonitor.ts`, `apps/api/drizzle.config.ts`

---

## Phase 11: Production Deployment (Fly.io) 📋

> *Day 17*

Deploy Relay Dog to production on Fly.io. Two separate Fly apps — API (Hono + Bun) and Web (Svelte static assets) — backed by Fly Postgres. Takes the app from "runs locally" to "live on the internet with a real domain."

**What ships:**
- **API Dockerfile** — multi-stage build (install → build → slim production image with non-root user)
- **Web Dockerfile** — multi-stage build (install → build → Nginx static serving with SPA fallback)
- **Fly.io configs** — `fly.toml` for API and web apps with auto-stop/start, concurrency limits
- **Fly Postgres** — provisioned with auto-backup, connected to API via internal network
- **Secrets management** — all credentials via `fly secrets`, never in code or images
- **Custom domain + TLS** — Let's Encrypt auto-provisioned via Fly
- **Deploy script** — `scripts/deploy.sh` with migration + health check verification
- **Staging environment** — separate Fly apps, auto-deploy from main
- **Production checklist** — pre-deploy, post-deploy, and ongoing verification steps

**Architecture:** Web (Nginx :80) → API (Bun :3001) → Fly Postgres (internal :5432)

**Effort:** ~3 hours

**Feature doc**: [phase-11-production-deployment.md](features/phase-11-production-deployment.md)

---

## Phase 12: NIP-66 Passive Monitoring ✅

> *Day 18*

Replace the active `setInterval`-based relay probing with a passive NIP-66 ingestor that subscribes to known monitor relays via WebSocket and ingests `kind:30166` events. Eliminates recurring API budget costs while providing richer, multi-vantage-point health data.

**What ships:**
- **NIP-66 Ingestor** — WebSocket subscriber that parses `kind:30166` events from monitor relays
- **Auto-reconnect** — exponential backoff (1s → 30s max) on monitor disconnect
- **Auto-create relays** — new relay URLs from monitor events are automatically added to the directory
- **On-demand checks** — `POST /api/relays/:id/check` writes to `relay_discoveries` with `monitorPubkey='self'`
- **Legacy table drop** — removed `health_checks` and `monitoring_jobs` tables
- **Retention cleanup** — daily cleanup of old `relay_events` (30d), `relay_info_snapshots` (180d), `relay_discoveries` (180d)

**NIPs**: NIP-66 (Relay Liveness Monitoring)

**Deleted:** `apps/api/src/jobs/relayMonitor.ts` (active probing loop)
**New:** `apps/api/src/jobs/nip66Ingestor.ts` (passive WebSocket subscriber)

**Feature doc**: [phase-12-nip66-passive-monitoring.md](features/phase-12-nip66-passive-monitoring.md)

---

## Effort Summary

| Phase | Duration | Difficulty | API Changes | DB Changes |
|-------|----------|------------|-------------|------------|
| 1 | 1 weekend | Easy | None | None |
| 2 | 2–3 weekends | Medium | None | relay_events table |
| 3 | 1 weekend | Medium | None | None (client-side) |
| 4 | 2 weekends | **Hard** | Auth endpoints | health_checks expansion |
| 5 | 2–3 weekends | Medium | Directory endpoints | monitoring_jobs expansion |
| 6 | 1 weekend | Medium | Auth + rate limits | None |
| 7 | 1–2 weekends | Medium | 5 endpoints (CRUD + upsert) | relay_discoveries, relay_list_entries, relays+7 cols, health_checks+1 col |
| 8 | 2–3 weekends | Medium | None (client-side) | None |
| 9 | 1 day | Easy | None | None |
| 10 | 1 day | Medium | Health check, retention | None |
| 11 | 0.5 day | Easy | None | None |
| 12 | 1 day | Medium | Ingestor job, route updates | Drop health_checks + monitoring_jobs |

---

## Phase 9: WCAG 2.2 AA Accessibility ✅

> *Day 15*

Comprehensive accessibility audit and fix to achieve WCAG 2.2 Level AA compliance. 123 issues found and fixed across 43 components, 9 composables, and 6 utility files.

**What ships:**
- **AccessibleTabs** — reusable WAI-ARIA tabs component (tablist/tab/tabpanel, arrow key nav)
- **Toast** — accessible in-app notifications replacing `window.alert()`/`window.confirm()`
- **createDebounce** — prevents search firehose (300ms debounce)
- **createClipboard** — clipboard API with success/error feedback
- **WCAG 2.2 SC 2.5.8** — all interactive elements ≥44×44px touch targets
- **WCAG 2.2 SC 2.3.3** — `prefers-reduced-motion` respects user motion preferences
- **WCAG 2.4.7** — `:focus-visible` ring for keyboard navigation
- **ARIA live regions** — `role="alert"`, `role="status"`, `aria-live` on all dynamic content
- **Label associations** — all `<label>` elements linked to inputs via `for`/`id`
- **Icon-only buttons** — all have `aria-label` attributes
- **Semantic HTML** — `<table>`, `<section>`, `<nav>` with proper ARIA landmarks
- **Skip-to-content link** — keyboard users can bypass header/navigation
- **Critical bug fixes** — event publishing/deletion rewritten with `nostr-tools SimplePool`
- **Memory leak fixes** — WebSocket close on error, eventIds Set capped, request cancellation

**Standards**: WCAG 2.2 AA, WAI-ARIA 1.2, ISO/IEC 40500:2025

**New components**: `AccessibleTabs.svelte`, `Toast.svelte`
**New composables**: `useDebounce.svelte.ts`, `useCopyToClipboard.svelte.ts`

**Feature doc**: [phase-9-accessibility.md](features/phase-9-accessibility.md)

---
