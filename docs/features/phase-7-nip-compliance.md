---
title: "🔄 Phase 7: NIP Compliance"
version: "0.10.0"
status: "complete"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🔄 Phase 7: NIP Compliance

> **v0.10.0** · **Complete** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


## Status

**Complete** ✅ (2026-06-30)

## Overview

Bring relay-dog in line with the latest NIP specifications (June 2026). This phase fixes outdated types, implements missing protocol features, and adds **NIP data validation** in the shared package. This is a **foundational quality phase** — not flashy, but critical for correctness and future extensibility.

> **Note:** Phase 6 already shipped API security hardening including Zod validation for relay create/update DTOs (`apps/api/src/lib/schemas.ts`), pagination caps, and basic NIP-42 input checks. Phase 7 focuses on **protocol correctness** — NIP types, monitor discovery, EOSE hints, and shared runtime schemas — not infra security.

## Already Shipped in Phase 6

Do **not** re-implement these in Phase 7:

| Item | Location | Status |
|------|----------|--------|
| `createRelaySchema` / `updateRelaySchema` | `apps/api/src/lib/schemas.ts` | ✅ Done |
| Pagination cap (`limit` max 100) | `apps/api/src/routes/relays.ts`, `directory.ts` | ✅ Done |
| NIP-42 challenge format validation | `useNip42Auth.svelte.ts` | ✅ Done |
| NIP-42 `relayUrl` normalization before signing | `useNip42Auth.svelte.ts` | ✅ Done |
| `https`-only relay icon URLs | `safeHttpsIconUrl()` in `relay.ts` | ✅ Done |
| CI dependency scanning | `.github/workflows/security.yml` | ✅ Done |

Phase 7 may **relocate** API DTO schemas to `packages/shared/src/schemas.ts` for reuse, but must not duplicate the security work above.

## User Stories

1. **As a user**, I want accurate NIP-11 relay information so I can make informed decisions about relay selection.
2. **As a user**, I want to see relay discovery data from trusted monitors so I don't have to rely solely on my own probes.
3. **As a user**, I want to know when a relay has more events than it sent me so I can paginate correctly.
4. **As a user**, I want to see relay popularity data (read/write relay lists) so I can pick well-connected relays.
5. **As a developer**, I want validated data types so malformed NIP-11 responses don't crash the UI or corrupt the database.

## Features

### 1. NIP-11 Type Modernization
Updated `RelayNip11` in `packages/shared/src/types.ts` with all current fields:

```typescript
export interface RelayNip11 {
  // ... existing fields ...
  banner?: string;           // Relay banner image URL
  pubkey?: string;           // Admin contact pubkey (32-byte hex)
  self?: string;             // Relay's own identity pubkey
  contact?: string;          // Contact URI (mailto, https)
  terms_of_service?: string; // Link to ToS document
  payments_url?: string;     // Payment portal URL
  fees?: RelayFees;          // Structured fee schedule
}
```

**New `RelayFees` type** (replaces incorrect `FeeInfo`):

```typescript
export interface RelayFeeEntry {
  kinds?: number[];       // Event kinds this fee applies to
  amount: number;         // Fee amount
  unit: string;           // "msats" or "sats"
  period?: number;        // Subscription period in seconds (optional)
}

export interface RelayFees {
  admission?: RelayFeeEntry[];
  subscription?: RelayFeeEntry[];
  publication?: RelayFeeEntry[];
}
```

**Deprecated:** `FeeInfo`, `posting_limit`, `relay_limitation` (not real NIP-11 fields)

**DB columns added**: `banner`, `pubkey`, `self`, `contact`, `terms_of_service`, `payments_url`, `fees` on `relays` table.

### 2. NIP-66 Relay Discovery Integration

Consume `kind:30166` events from relay monitors and display alongside own health checks.

**New DB table: `relay_discoveries`**
```sql
CREATE TABLE relay_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relay_url TEXT NOT NULL,
  monitor_pubkey TEXT NOT NULL,
  rtt_open INTEGER,
  rtt_read INTEGER,
  rtt_write INTEGER,
  network_type TEXT,           -- 'clearnet', 'tor', 'i2p', 'loki'
  relay_type TEXT,             -- PascalCase enum
  supported_nips INTEGER[],
  requirements TEXT[],         -- ['auth', '!payment', 'pow']
  topics TEXT[],
  geohash TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(relay_url, monitor_pubkey)
);
```

**New API endpoints:**
```
GET  /api/relays/:id/discoveries  → monitor observations + aggregated stats
POST /api/relays/:id/discoveries  → upsert discovery from monitor (auth required)
```

**Frontend: MonitorDataPanel component**
- Show RTT values from monitors (open/read/write)
- Display monitor count ("Observed by 5 monitors")
- Show network type and geohash
- Visual comparison: your probe vs. monitor data

**Composable: `useRelayDiscovery.svelte.ts`**
- Subscribe to monitor relay events
- Parse kind:30166 events into discovery observations

### 3. NIP-67 EOSE Completeness Hint
Parse the optional 3rd element of `EOSE` messages.

**New types in `packages/shared/src/types.ts`:**
```typescript
export type EoseHint = 'finish' | 'more';

export interface EoseResult {
  subscriptionId: string;
  hints: EoseHint[];
  complete: boolean;  // true if 'finish' present
  hasMore: boolean;   // true if 'more' present
}
```

**DB column**: `nip67_eose_hints` (JSONB) on `health_checks` table.

**Frontend:**
- `EoseIndicator.svelte` — Shows "All stored events received ✅" vs. "More events available — paginate with older filters"
- Live Stream tab: Visual indicator when stream is complete vs. partial

### 4. NIP-65 Relay List Display
Show kind `10002` relay list data when inspecting a relay.

**New DB table: `relay_list_entries`**
```sql
CREATE TABLE relay_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_pubkey TEXT NOT NULL,
  relay_url TEXT NOT NULL,
  marker TEXT,           -- 'read', 'write', or NULL (both)
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(author_pubkey, relay_url)
);
```

**New API endpoints:**
```
GET  /api/relays/:id/popularity  → { readCount, writeCount, readers, writers }
POST /api/relays/:id/popularity  → upsert relay list entry (auth required)
```

**Frontend:**
- `RelayListBadge.svelte` — "Listed as write relay by 18 users"
- Directory cards show popularity badges

### 5. NIP-50 Search Filter

> **Existing:** `GET /api/directory?search=...` already filters via SQL `ILIKE` on name/url (Phase 5).

NIP-50 `search` field forwarding when the target relay supports it:

**Frontend:**
- Directory search bar uses NIP-50 `search` when relay supports it (check `supported_nips` includes `50`)
- Fallback to `ILIKE` for relays that don't support NIP-50

### 6. Zod Validation Schemas (Shared Package)

Added runtime validation for **NIP protocol data** at the shared package level.

**New file: `packages/shared/src/schemas.ts`**

Schemas implemented:
- `RelayNip11Schema` — NIP-11 document validation
- `NostrEventSchema` — NIP-01 event structure validation
- `RelayDiscoverySchema` — NIP-66 discovery event validation
- `RelayListEventSchema` — NIP-65 relay list event validation
- `AuthEventSchema` — NIP-42 auth event validation
- `PaginationSchema` — Shared pagination parameters
- `RelayLimitationSchema`, `RelayFeeEntrySchema`, `RelayFeesSchema` — Sub-schemas

### 7. NIP-40 Expiration Timestamp
Display expired event indicators.

**Frontend:**
- `ExpiredBadge.svelte` — "⚠ Expired" badge if `tags` contains `["expiration", "<past_timestamp>"]`
- EventVerifier: Show expiration status and date
- Live Stream: Filter expired events option

### 8. NIP-42 Auth Hardening (Remaining)

> **Already done in Phase 6:** Challenge format validation (printable ASCII, max 256 chars) and `relayUrl` normalization before signing in `useNip42Auth.svelte.ts`.

**Implemented in Phase 7:**

**Frontend:**
- `AuthPrefixDisplay.svelte` — Show `auth-required:` and `restricted:` prefixes in OK/CLOSED messages
- `AuthStatusBadge.svelte` — Auth status indicator (authenticated / auth required / anonymous / failed)

## Component Structure

```
components/
├── MonitorDataPanel.svelte      # NIP-66 monitor observations
├── EoseIndicator.svelte         # NIP-67 completeness hint
├── RelayListBadge.svelte        # NIP-65 popularity display
├── FeeDisplay.svelte            # Updated for new fees structure
├── ExpiredBadge.svelte          # NIP-40 expiration indicator
├── AuthPrefixDisplay.svelte     # NIP-42 OK/CLOSED prefix display
├── AuthStatusBadge.svelte       # NIP-42 auth status display
└── ConnectionStatusPanel.svelte # Connection status overview

lib/composables/
└── useRelayDiscovery.svelte.ts  # NIP-66 subscription

packages/shared/
├── src/schemas.ts               # Zod NIP validation schemas
└── src/types.ts                 # Updated NIP types
```

## API Changes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/relays/:id/discoveries` | — | NIP-66 monitor observations for a relay |
| `POST` | `/api/relays/:id/discoveries` | ✅ | Upsert discovery from monitor |
| `GET` | `/api/relays/:id/popularity` | — | NIP-65 read/write relay counts |
| `POST` | `/api/relays/:id/popularity` | ✅ | Upsert relay list entry |
| `GET` | `/api/directory?search=...` | — | Enhanced ILIKE search (NIP-50 forwarding when relay supports it) |

No changes to existing mutating relay routes — auth and rate limits from Phase 6 remain in place.

## Database Changes

| Table | Change |
|-------|--------|
| `relays` | **Add columns**: `banner`, `pubkey`, `self`, `contact`, `terms_of_service`, `payments_url`, `fees` |
| `health_checks` | **Add column**: `nip67_eose_hints` (JSONB) |
| `relay_discoveries` | **New table** — NIP-66 monitor observations |
| `relay_list_entries` | **New table** — NIP-65 relay list tracking |

## Dependencies

| Package | Package location | Purpose |
|---------|------------------|---------|
| `zod` | `packages/shared` (new) | NIP protocol validation schemas |
| `zod` | `apps/api` (existing from Phase 6) | API DTO validation |

## Testing

1. Fetch NIP-11 from nostr.wine → should parse `fees` structure correctly
2. Subscribe to monitor relay → should populate `relay_discoveries`
3. Connect to relay supporting NIP-67 → should show "All events received" indicator
4. Search directory with NIP-50 → should forward `search` filter when relay supports NIP 50; fall back to ILIKE otherwise
5. View expired event → should show expiration badge
6. Auth with event >10 min old → should show timing warning (NIP-42 hardening)
7. Parse malformed NIP-11 JSON → Zod schema should reject without crashing UI

## Migration from Phase 6

- API DTO schemas relocated from `apps/api/src/lib/schemas.ts` → `packages/shared/src/schemas.ts` (NIP schemas live in shared)
- SSRF guard, auth middleware, and rate limiting unchanged — Phase 7 is additive
- NIP-42 challenge/URL validation stays in `useNip42Auth.svelte.ts`; Phase 7 adds prefix display and status badge

## Migration from Phase 5

- `FeeInfo` type → deprecated, replaced by `RelayFees`
- `posting_limit` field → deprecated (not a real NIP-11 field)
- `relay_limitation` field → deprecated (not a real NIP-11 field)
- `RelayNip11.tags` field → deprecated (not a real NIP-11 field)
- Frontend `FeeDisplay` component → rewritten for new fee structure

---

*Previous: [Phase 6 — Security Hardening](phase-6-security-hardening.md) | Next: [Phase 8 — Developer Toolkit](phase-8-developer-toolkit.md)*

---
