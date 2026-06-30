# 🗺️ Roadmap

Relay Scope is built in 6 phases, each delivering standalone value while building toward a complete Nostr relay inspector.

## Status

```
Phase 1  ████████████████████  NIP-11 Viewer (MVP)              ✅ Done
Phase 2  ████████████████████  Live Event Stream                 ✅ Done
Phase 3  ████████████████████  Event Verifier & Inspector        ✅ Done
Phase 4  ████████████████████  Auth & Health Dashboard           ✅ Done
Phase 5  ████████████████████  Relay Directory & Comparison      ✅ Done
Phase 6  ░░░░░░░░░░░░░░░░░░░░  NIP Compliance & Modernization    📋 Planned
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

## Phase 6: NIP Compliance & Protocol Modernization 📋

> *Weekend 10–11*

Bring relay-dog in line with the latest NIP specs (June 2026). Fix outdated types, implement missing protocol features, and add Zod validation.

**What ships:**
- Updated NIP-11 types with all current fields (banner, pubkey, fees, etc.)
- NIP-66 relay discovery — consume kind:30166 events from monitors
- NIP-67 EOSE completeness hints — show "all events received" vs. "more available"
- NIP-65 relay list display — show read/write popularity per relay
- NIP-50 search filter — content search for relays that support it
- NIP-40 expiration — expired event indicators
- NIP-42 auth hardening — timing verification, prefix display
- Zod validation schemas for all NIP data
- Deprecated incorrect types (FeeInfo, posting_limit, relay_limitation)

**NIPs**: NIP-11 (updated), NIP-40, NIP-42 (hardened), NIP-50, NIP-65, NIP-66 (integrated), NIP-67

**New dependencies**: `zod`

---

## Effort Summary

| Phase | Duration | Difficulty | API Changes | DB Changes |
|-------|----------|------------|-------------|------------|
| 1 | 1 weekend | Easy | None | None |
| 2 | 2–3 weekends | Medium | None | relay_events table |
| 3 | 1 weekend | Medium | None | None (client-side) |
| 4 | 2 weekends | **Hard** | Auth endpoints | health_checks expansion |
| 5 | 2–3 weekends | Medium | Directory endpoints | monitoring_jobs expansion |
| 6 | 1–2 weekends | Medium | 3 endpoints | relay_discoveries, relay_list_entries |
