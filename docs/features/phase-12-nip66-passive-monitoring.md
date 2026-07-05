---
title: "🔄 Phase 12: NIP-66 Passive Monitoring"
version: "0.10.0"
status: "complete"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🔄 Phase 12: NIP-66 Passive Monitoring

> **v0.10.0** · **Planned** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


## Status

**Complete** ✅ (2026-07-05)

## Overview

Replace the active `setInterval`-based relay probing (`relayMonitor.ts`) with a passive NIP-66 ingestor that subscribes to known monitor relays via WebSocket and ingests `kind:30166` events. This eliminates recurring API budget costs (outbound HTTP/WebSocket probes every 30s for every relay) while providing richer, multi-vantage-point health data from the Nostr network's own monitoring infrastructure.

> **Note:** The current monitor (`apps/api/src/jobs/relayMonitor.ts`) runs a `setInterval` loop that probes every relay in the database every 30 seconds. This generates significant outbound connections and database writes. Phase 12 replaces this with a Nostr-native passive approach.
>
> **Reference:** [NIP-66: Relay Liveness Monitoring](https://nips.nostr.com/66) — the spec defining `kind:10166` (monitor announcements) and `kind:30166` (relay discovery events).
> **Reference:** [NIP Reference](nip-reference.md#nip-66-relay-discovery) — existing NIP-66 documentation in this project.

## Already Shipped in Prior Phases

Do **not** re-implement these in Phase 12:

| Item | Location | Status |
|------|----------|--------|
| NIP-66 `relay_discoveries` table | `apps/api/src/db/schema.ts` | ✅ Done |
| NIP-66 GET endpoint | `apps/api/src/routes/discover.ts` | ✅ Done |
| NIP-66 shared types (`RelayDiscovery`, `RelayDiscoveryEvent`) | `packages/shared/src/types.ts` | ✅ Done |
| NIP-66 validation schema (`RelayDiscoverySchema`) | `packages/shared/src/schemas.ts` | ✅ Done |
| `MonitorDataPanel.svelte` frontend display | `apps/web/src/components/MonitorDataPanel.svelte` | ✅ Done |
| `useRelayDiscovery` composable | `apps/web/src/lib/composables/useRelayDiscovery.svelte.ts` | ✅ Done |
| On-demand health check (`POST /api/relays/:id/check`) | `apps/api/src/routes/relays.ts` | ✅ Done |
| Client-side probes (HTTP, WebSocket, CORS, latency) | `apps/web/src/utils/relay.ts` | ✅ Done |

## User Stories

1. **As a user**, I want relay health status to be available without the server actively probing every relay, so the service is cheaper to run and can scale.
2. **As a user**, I want health data from multiple vantage points (NIP-66 monitors), so I get a more accurate picture of relay availability.
3. **As an operator**, I want to remove the background polling loop, so my API budget and database writes are dramatically reduced.
4. **As a user**, I want to still trigger manual health checks on specific relays, so I can verify a relay's status on demand even if no NIP-66 monitor covers it.
5. **As an operator**, I want the server to auto-reconnect to monitor relays on disconnect, so health data keeps flowing without manual intervention.

## Features

---

### 1. NIP-66 Ingestor Job

Replace `relayMonitor.ts` with a new `nip66Ingestor.ts` that subscribes to known NIP-66 monitor relays via WebSocket and parses incoming `kind:30166` events.

**New files:**
- `apps/api/src/jobs/nip66Ingestor.ts`

**Deleted files:**
- `apps/api/src/jobs/relayMonitor.ts`

**How it works:**

1. On server start, connects to hardcoded monitor relay URLs via WebSocket
2. Sends `["REQ", "nip66-sub", { "kinds": [30166] }]` to each monitor
3. Parses incoming `kind:30166` event tags per the NIP-66 spec:

| Tag | Field | Example |
|-----|-------|---------|
| `["d", url]` | `relayUrl` | `["d", "wss://relay.damus.io/"]` |
| `["rtt-open", ms]` | `rttOpen` | `["rtt-open", "234"]` |
| `["rtt-read", ms]` | `rttRead` | `["rtt-read", "150"]` |
| `["rtt-write", ms]` | `rttWrite` | `["rtt-write", "200"]` |
| `["n", type]` | `networkType` | `["n", "clearnet"]` |
| `["T", type]` | `relayType` | `["T", "PublicInbox"]` |
| `["N", nip]` | `supportedNips` | `["N", "40"]` (repeat per NIP) |
| `["R", req]` | `requirements` | `["R", "auth"]` (repeat per req) |
| `["t", topic]` | `topics` | `["t", "nsfw"]` (repeat per topic) |
| `["g", geohash]` | `geohash` | `["g", "ww8p1r4t8"]` |

4. Upserts into `relay_discoveries` table using `ON CONFLICT (relay_url, monitor_pubkey) DO UPDATE`
5. Also upserts into `relays` table if the relay URL is new (auto-creates relay records)
6. Auto-reconnects on disconnect with exponential backoff (1s → 2s → 4s → ... → 30s max)
7. Subscribes to multiple monitors in parallel for redundancy

```typescript
// apps/api/src/jobs/nip66Ingestor.ts — pseudocode
import { WebSocket } from 'ws';

const DEFAULT_MONITOR_RELAYS = [
  'wss://relay-monitor.migalmoreno.com',
];

export function startNip66Ingestor() {
  const monitorUrls = env.MONITOR_RELAYS
    ? env.MONITOR_RELAYS.split(',').map(u => u.trim())
    : DEFAULT_MONITOR_RELAYS;

  for (const url of monitorUrls) {
    connectToMonitor(url);
  }
}

function connectToMonitor(url: string) {
  const ws = new WebSocket(url);
  let reconnectDelay = 1000;

  ws.onopen = () => {
    reconnectDelay = 1000; // reset backoff
    ws.send(JSON.stringify(['REQ', 'nip66-sub', { kinds: [30166] }]));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);
    if (data[0] === 'EVENT' && data[2]?.kind === 30166) {
      await ingestDiscoveryEvent(data[2]);
    }
  };

  ws.onclose = () => {
    setTimeout(() => connectToMonitor(url), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
  };
}

async function ingestDiscoveryEvent(event: unknown) {
  // Validate with RelayDiscoverySchema
  // Parse tags into CreateDiscoveryInput
  // Upsert into relay_discoveries
  // Upsert into relays (auto-create if new)
}
```

---

### 2. Rewrite On-Demand Health Check

The existing `POST /api/relays/:id/check` currently writes to the `health_checks` table. After this phase, it writes to `relay_discoveries` with `monitorPubkey = 'self'` (sentinel value for first-party checks).

**Modified files:**
- `apps/api/src/routes/relays.ts`

```typescript
// Before (writes to health_checks)
await db.insert(healthChecks).values({ relayId, httpReachable, ... });

// After (writes to relay_discoveries with self sentinel)
await db.insert(relayDiscovered).values({
  relayUrl: relay.url,
  monitorPubkey: 'self', // first-party on-demand check
  rttOpen: latencyMs,
  // ... other fields from probe results
}).onConflictDoUpdate({
  target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
  set: { rttOpen: latencyMs, discoveredAt: new Date() },
});
```

---

### 3. Drop `health_checks` and `monitoring_jobs` Tables

**New files:**
- `apps/api/drizzle/XXXX_drop_health_checks_and_monitoring_jobs.sql`

```sql
DROP TABLE IF EXISTS health_checks CASCADE;
DROP TABLE IF EXISTS monitoring_jobs CASCADE;
```

**Modified files:**
- `apps/api/src/db/schema.ts` — remove `healthChecks` and `monitoringJobs` table definitions, indexes, relations, and type exports

---

### 4. Update API Routes — Remove `health_checks` References

**`apps/api/src/routes/relays.ts`:**
- Remove health check join in relay list endpoint (currently lines 115–134). Relay list no longer returns `lastHealthCheck`.
- Remove health check join in relay detail endpoint (currently lines 148–160). Relay detail no longer returns `lastHealthCheck`.
- Rewrite `POST /api/relays/:id/check` to store in `relay_discoveries` (see Feature 2).
- Remove `GET /api/relays/:id/history` endpoint (health check history no longer applicable).

**`apps/api/src/routes/directory.ts`:**
- Remove `lastHealthCheck` from `toDirectoryRelay()` mapper (currently lines 28–36).
- Remove the health check fetch pattern (currently lines 136–154).
- Replace latency sort: query `relay_discoveries` for `rtt_open` of the latest observation per relay.
- Rewrite comparison logic to use `relay_discoveries` data instead of `health_checks`.

**`apps/api/src/routes/discover.ts`:**
- Remove `POST /:id/discoveries` endpoint (server ingests directly from monitors).
- Keep `GET /:id/discoveries` endpoint (reads from `relay_discoveries` table).

---

### 5. Update Shared Types

**Modified files:**
- `packages/shared/src/types.ts`

```typescript
// Remove
export interface HealthCheck { ... }

// Update DirectoryRelay — replace lastHealthCheck with lastDiscovery
export interface DirectoryRelay {
  // ... existing fields ...
  lastDiscovery: {
    rttOpen: number | null;
    rttRead: number | null;
    rttWrite: number | null;
    networkType: string | null;
    discoveredAt: Date;
  } | null;
}

// Update ComparisonDiff to use NIP-66 fields
export interface ComparisonDiff {
  latencyWinner: 'A' | 'B' | 'tie';
  healthWinner: 'A' | 'B' | 'tie';
  // ... other fields ...
}
```

---

### 6. Update Frontend Components

**`apps/web/src/components/RelayCard.svelte`:**

```typescript
// Before
const isOnline = $derived(
  relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable,
);
const latencyDisplay = $derived(
  relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—',
);

// After
const isOnline = $derived(
  relay.lastDiscovery != null &&
  (Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime()) < 24 * 60 * 60 * 1000,
);
const latencyDisplay = $derived(
  relay.lastDiscovery?.rttOpen != null ? `${relay.lastDiscovery.rttOpen}ms` : '—',
);
```

**`apps/web/src/components/ComparisonView.svelte`:**

```typescript
// Before
function healthStatus(relay: DirectoryRelay): string {
  if (relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable) {
    return 'Online';
  }
  return 'Offline';
}

// After
function healthStatus(relay: DirectoryRelay): string {
  if (relay.lastDiscovery != null &&
      (Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime()) < 24 * 60 * 60 * 1000) {
    return 'Online';
  }
  return 'Unknown';
}
```

**`apps/web/src/components/MonitorDataPanel.svelte`:** No changes (already reads from `relay_discoveries`).

---

### 7. Update `index.ts` and Environment

**`apps/api/src/index.ts`:**

```typescript
// Remove
import { startMonitor } from './jobs/relayMonitor';
const monitorInterval = Math.max(10_000, env.MONITOR_INTERVAL_MS);
startMonitor(monitorInterval);

// Add
import { startNip66Ingestor } from './jobs/nip66Ingestor';
startNip66Ingestor();
```

**`packages/config/env/src/server.ts`:**

```typescript
// Remove
MONITOR_INTERVAL_MS: z.coerce.number().int().min(1000).default(60000),

// Add
MONITOR_RELAYS: z.string().optional(), // comma-separated monitor relay URLs
```

---

### 8. Data Retention Simplification

The `relay_discoveries` table uses upserts on `(relayUrl, monitorPubkey)`, so it's naturally bounded by `(unique relays × unique monitors)`. The 180-day retention cleanup from the old monitor is no longer needed for discoveries.

However, `relay_events` and `relay_info_snapshots` still need retention. Move the retention logic to a one-time `setTimeout` on startup (runs once after 60s, then daily):

```typescript
// In index.ts — one-time retention scheduler (not a cron)
setTimeout(() => {
  runRetentionCleanup();
  setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
}, 60_000);
```

---

## NIPs

| NIP | Name | Status | Notes |
|-----|------|--------|-------|
| NIP-66 | Relay Liveness Monitoring | ✅ Ingestor | Passive subscription to `kind:30166` events from monitor relays |

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/api/src/jobs/nip66Ingestor.ts` | **New** | NIP-66 WebSocket subscriber and event ingester |
| `apps/api/src/jobs/relayMonitor.ts` | **Deleted** | Active relay probing loop removed |
| `apps/api/drizzle/XXXX_*.sql` | **New** | Migration: drop `health_checks` and `monitoring_jobs` tables |
| `apps/api/src/db/schema.ts` | Modified | Remove `healthChecks` and `monitoringJobs` tables, relations, types |
| `apps/api/src/index.ts` | Modified | Swap `startMonitor` for `startNip66Ingestor`, add retention scheduler |
| `apps/api/src/routes/relays.ts` | Modified | Remove HC joins, rewrite on-demand check to use `relay_discoveries`, remove history endpoint |
| `apps/api/src/routes/directory.ts` | Modified | Replace `lastHealthCheck` with `lastDiscovery`, fix latency sort |
| `apps/api/src/routes/discover.ts` | Modified | Remove `POST /:id/discoveries` endpoint |
| `packages/shared/src/types.ts` | Modified | Remove `HealthCheck`, update `DirectoryRelay` with `lastDiscovery` |
| `packages/shared/src/schemas.ts` | Modified | Remove `HealthCheck` import (if any) |
| `packages/config/env/src/server.ts` | Modified | Add `MONITOR_RELAYS`, remove `MONITOR_INTERVAL_MS` |
| `apps/web/src/components/RelayCard.svelte` | Modified | Use `lastDiscovery` for online status and latency display |
| `apps/web/src/components/ComparisonView.svelte` | Modified | Use `lastDiscovery` for health status and comparison |
| `docs/architecture/overview.md` | Modified | Update monitor description from active probe to NIP-66 ingestor |
| `docs/features/phase-12-nip66-passive-monitoring.md` | **New** | This document |

## Effort

| Task | Estimated Time |
|------|---------------|
| NIP-66 ingestor job (WebSocket subscriber + parser) | 2h |
| Rewrite on-demand check to use `relay_discoveries` | 30m |
| Drop tables + schema cleanup | 30m |
| Update API routes (relays, directory, discover) | 1h |
| Update shared types | 30m |
| Update frontend components (RelayCard, ComparisonView) | 30m |
| Update index.ts + env config | 15m |
| Data retention simplification | 15m |
| Type-check, lint, build verification | 15m |
| Documentation updates | 30m |
| **Total** | **~6 hours** |

---
