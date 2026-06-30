# 🔄 Phase 6: NIP Compliance & Protocol Modernization

## Status

**Planned** 📋 (2026-06-30)

## Overview

Bring relay-dog in line with the latest NIP specifications (June 2026). This phase fixes outdated types, implements missing protocol features, and adds Zod validation schemas across the entire data layer. This is a **foundational quality phase** — not flashy, but critical for correctness and future extensibility.

## User Stories

1. **As a user**, I want accurate NIP-11 relay information so I can make informed decisions about relay selection.
2. **As a user**, I want to see relay discovery data from trusted monitors so I don't have to rely solely on my own probes.
3. **As a user**, I want to know when a relay has more events than it sent me so I can paginate correctly.
4. **As a user**, I want to see relay popularity data (read/write relay lists) so I can pick well-connected relays.
5. **As a developer**, I want validated data types so malformed NIP-11 responses don't crash the UI or corrupt the database.

## Features

### 1. NIP-11 Type Modernization
Update `RelayNip11` to match the current spec with all fields:

```typescript
// Missing fields to add
banner?: string;           // Relay banner image URL
pubkey?: string;           // Admin contact pubkey (32-byte hex)
self?: string;             // Relay's own identity pubkey
contact?: string;          // Contact URI (mailto, https)
terms_of_service?: string; // Link to ToS document
payments_url?: string;     // Payment portal URL
fees?: RelayFees;          // Structured fee schedule
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

**Deprecate:** `FeeInfo`, `posting_limit`, `relay_limitation` (not real NIP-11 fields)

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

**New API endpoint:**
```
GET /api/directory/:url/discoveries
→ Returns all monitor observations for a relay
```

**New WebSocket subscription in monitor job:**
```typescript
// Subscribe to kind:30166 from well-known monitor relays
const MONITOR_RELAYS = [
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
  // Add more known monitors
];

for (const monitor of MONITOR_RELAYS) {
  const ws = new WebSocket(monitor);
  ws.send(JSON.stringify([
    'REQ',
    `monitor-${Date.now()}`,
    { kinds: [30166], limit: 200 }
  ]));
  // Parse events, upsert into relay_discoveries
}
```

**Frontend: MonitorDataPanel component**
- Show RTT values from monitors (open/read/write)
- Display monitor count ("Observed by 5 monitors")
- Show network type and geohash
- Visual comparison: your probe vs. monitor data

### 3. NIP-67 EOSE Completeness Hint
Parse the optional 3rd element of `EOSE` messages.

**New types:**
```typescript
export type EoseHint = 'finish' | 'more';

export interface EoseResult {
  subscriptionId: string;
  hints: EoseHint[];
  complete: boolean;  // true if 'finish' present
  hasMore: boolean;   // true if 'more' present
}
```

**Frontend impact:**
- Live Stream tab: Show "All stored events received ✅" vs. "More events available — paginate with older filters"
- EventFeed: Add visual indicator when stream is complete vs. partial

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

**New API endpoint:**
```
GET /api/directory/:url/popularity
→ { readCount: 42, writeCount: 18, readers: [...], writers: [...] }
```

**Frontend:**
- Relay profile shows "Listed as write relay by 18 users"
- Directory cards show popularity badges

### 5. NIP-50 Search Filter
Add `search` field support to the directory and live stream.

**API change:**
```
GET /api/directory?search=nostr+relays
→ Forward `search` filter to WebSocket REQ as `search` field
```

**Frontend:**
- Directory search bar uses NIP-50 `search` when relay supports it (check `supported_nips` includes `50`)
- Fallback to `ILIKE` for relays that don't support NIP-50

### 6. Zod Validation Schemas
Add runtime validation for all NIP data at the shared package level.

**New file: `packages/shared/src/schemas.ts`**

```typescript
import { z } from 'zod';

// NIP-11 Schema
export const RelayLimitationSchema = z.object({
  max_message_length: z.number().int().positive().optional(),
  max_subscriptions: z.number().int().positive().optional(),
  max_filters: z.number().int().positive().optional(),
  max_limit: z.number().int().positive().optional(),
  max_subid_length: z.number().int().positive().optional(),
  max_event_tags: z.number().int().positive().optional(),
  max_content_length: z.number().int().positive().optional(),
  min_pow_difficulty: z.number().int().min(0).optional(),
  auth_required: z.boolean().optional(),
  payment_required: z.boolean().optional(),
  restricted_writes: z.boolean().optional(),
  created_at_lower_limit: z.number().int().optional(),
  created_at_upper_limit: z.number().int().optional(),
  default_limit: z.number().int().positive().optional(),
});

export const RelayFeeEntrySchema = z.object({
  kinds: z.array(z.number().int()).optional(),
  amount: z.number().int().min(0),
  unit: z.enum(['msats', 'sats']),
  period: z.number().int().positive().optional(),
});

export const RelayFeesSchema = z.object({
  admission: z.array(RelayFeeEntrySchema).optional(),
  subscription: z.array(RelayFeeEntrySchema).optional(),
  publication: z.array(RelayFeeEntrySchema).optional(),
});

export const RelayNip11Schema = z.object({
  name: z.string().max(30).optional(),
  description: z.string().optional(),
  banner: z.string().url().optional(),
  icon: z.string().url().optional(),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  self: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  contact: z.string().optional(),
  supported_nips: z.array(z.number().int().min(1)).optional(),
  software: z.string().optional(),
  version: z.string().optional(),
  terms_of_service: z.string().url().optional(),
  limitation: RelayLimitationSchema.optional(),
  payments_url: z.string().url().optional(),
  fees: RelayFeesSchema.optional(),
}).passthrough(); // Allow unknown fields (NIP says ignore unknown)

// NIP-01 Event Schema
export const NostrEventSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
  created_at: z.number().int().min(0),
  kind: z.number().int().min(0),
  tags: z.array(z.array(z.string().nullable()).min(1)),
  content: z.string(),
  sig: z.string().regex(/^[0-9a-f]{128}$/),
});

// NIP-66 Relay Discovery Schema
export const RelayDiscoverySchema = z.object({
  kind: z.literal(30166),
  tags: z.array(z.array(z.string())),
  content: z.string(),
}).passthrough();

// NIP-65 Relay List Schema
export const RelayListEventSchema = z.object({
  kind: z.literal(10002),
  tags: z.array(z.array(z.string())),
  content: z.string(),
}).passthrough();

// NIP-42 Auth Event Schema
export const AuthEventSchema = z.object({
  kind: z.literal(22242),
  content: z.literal(''),
  tags: z.array(z.array(z.string())),
  created_at: z.number().int(),
}).passthrough();

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'url', 'lastChecked', 'latency']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Create/Update Relay Schemas
export const CreateRelaySchema = z.object({
  url: z.string().trim().min(1).refine(
    (u) => /^wss?:\/\//.test(u) || /^https?:\/\//.test(u),
    'Must be a valid relay URL',
  ),
  name: z.string().max(200).optional(),
  isPublic: z.boolean().optional(),
});

export const UpdateRelaySchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
  country: z.string().max(3).optional(),
});
```

### 7. NIP-40 Expiration Timestamp
Display expired event indicators.

**Frontend changes:**
- EventCard: Show "⚠ Expired" badge if `tags` contains `["expiration", "<past_timestamp>"]`
- EventVerifier: Show expiration status and date
- Live Stream: Filter expired events option

### 8. NIP-42 Auth Hardening
Complete the auth implementation with timing verification.

**Backend (auth verification):**
```typescript
// Verify AUTH event per NIP-42 spec
function verifyAuthEvent(event: AuthEvent, challenge: string, relayUrl: string): boolean {
  // 1. kind must be 22242
  if (event.kind !== 22242) return false;

  // 2. created_at must be within ~10 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(event.created_at - now) > 600) return false;

  // 3. 'challenge' tag must match
  const challengeTag = event.tags.find(([k]) => k === 'challenge');
  if (!challengeTag || challengeTag[1] !== challenge) return false;

  // 4. 'relay' tag must match (domain check is sufficient)
  const relayTag = event.tags.find(([k]) => k === 'relay');
  if (!relayTag) return false;
  const eventDomain = new URL(relayTag[1]).hostname;
  const expectedDomain = new URL(relayUrl).hostname;
  if (eventDomain !== expectedDomain) return false;

  return true;
}
```

**Frontend:**
- Show `auth-required:` and `restricted:` prefixes in OK/CLOSED messages
- Display auth timing warning if `created_at` is suspicious

## Component Structure

```
src/
├── components/
│   ├── MonitorDataPanel.svelte      # NIP-66 monitor observations
│   ├── EoseIndicator.svelte         # NIP-67 completeness hint
│   ├── RelayListBadge.svelte        # NIP-65 popularity display
│   ├── FeeDisplay.svelte            # Updated for new fees structure
│   ├── ExpiredBadge.svelte          # NIP-40 expiration indicator
│   └── AuthPrefixDisplay.svelte     # NIP-42 OK/CLOSED prefix display
├── lib/
│   └── composables/
│       ├── useRelayDiscovery.svelte.ts  # NIP-66 subscription
│       └── useEoseHints.svelte.ts       # NIP-67 parsing
└── utils/
    └── nipValidation.ts                 # Zod schema usage
```

## API Changes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/directory/:url/discoveries` | NIP-66 monitor observations |
| `GET` | `/api/directory/:url/popularity` | NIP-65 read/write relay counts |
| `GET` | `/api/directory?search=...` | NIP-50 search filter support |

## Database Changes

| Table | Change |
|-------|--------|
| `relay_discoveries` | **New** — NIP-66 monitor observations |
| `relay_list_entries` | **New** — NIP-65 relay list tracking |
| `relays` | Add `banner`, `pubkey`, `self`, `contact`, `terms_of_service`, `payments_url`, `fees` columns |
| `health_checks` | Add `nip67_eose_hints` JSONB column |

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `zod` | Runtime validation schemas | `^3.24.0` |

## Testing

1. Fetch NIP-11 from nostr.wine → should parse `fees` structure correctly
2. Subscribe to monitor relay → should populate `relay_discoveries`
3. Connect to relay supporting NIP-67 → should show "All events received" indicator
4. Search directory with NIP-50 → should use `search` filter when supported
5. View expired event → should show expiration badge
6. Auth with timing check → should reject events older than 10 minutes
7. Run `bun audit` → should remain clean after adding Zod

## Migration from Phase 5

- `FeeInfo` type → deprecated, replaced by `RelayFees`
- `posting_limit` field → removed (not a real NIP-11 field)
- `relay_limitation` field → removed (not a real NIP-11 field)
- `RelayNip11.tags` field → removed (not a real NIP-11 field)
- Frontend `FeeDisplay` component → rewritten for new fee structure

---

*Previous: [Phase 5 — Relay Directory & Comparison](phase-5-directory.md)*
