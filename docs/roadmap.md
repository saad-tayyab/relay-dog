# 🗺️ Roadmap

Relay Scope is built in 7 phases, each delivering standalone value while building toward a complete Nostr relay inspector.

## Status

```
Phase 1  ████████████████████  NIP-11 Viewer (MVP)              ✅ Done
Phase 2  ████████████████████  Live Event Stream                 ✅ Done
Phase 3  ████████████████████  Event Verifier & Inspector        ✅ Done
Phase 4  ████████████████████  Auth & Health Dashboard           ✅ Done
Phase 5  ████████████████████  Relay Directory & Comparison      ✅ Done
Phase 6  ████████████████████  Security Hardening                ✅ Done
Phase 7  ░░░░░░░░░░░░░░░░░░░░  NIP Compliance & Modernization    📋 Planned
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

## Phase 7: NIP Compliance & Protocol Modernization 📋

> *Weekend 10–11*

Bring relay-dog in line with the latest NIP specs (June 2026). Fix outdated types, implement missing protocol features, and add NIP validation schemas in the **shared package** (API DTO schemas already shipped in Phase 6).

**What ships:**
- Updated NIP-11 types with all current fields (banner, pubkey, fees, etc.)
- NIP-66 relay discovery — consume kind:30166 events from monitors (Phase 5 spec was not implemented)
- NIP-67 EOSE completeness hints — show "all events received" vs. "more available"
- NIP-65 relay list display — show read/write popularity per relay
- NIP-50 search filter — forward `search` to relays that support it (directory ILIKE already exists)
- NIP-40 expiration — expired event indicators
- NIP-42 auth hardening — OK/CLOSED prefix display, timing warnings (challenge validation done in Phase 6)
- Zod NIP schemas in `packages/shared` (optional consolidation of API DTO schemas from Phase 6)
- Deprecated incorrect types (FeeInfo, posting_limit, relay_limitation)

**NIPs**: NIP-11 (updated), NIP-40, NIP-42 (display/timing), NIP-50, NIP-65, NIP-66 (integrated), NIP-67

**New dependencies**: `zod` in `packages/shared` (already in `apps/api` from Phase 6)

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
| 7 | 1–2 weekends | Medium | 3 endpoints | relay_discoveries, relay_list_entries |
