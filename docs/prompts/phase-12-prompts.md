# 🤖 Phase 12: NIP-66 Passive Monitoring — Implementation Prompts

## Project Context

```
I'm working on Relay Dog, a Nostr relay inspector.

Tech stack:
- Bun 1.3 + Turborepo monorepo
- Apps: Vite+Svelte 5 (web), Hono+Bun (api)
- Drizzle ORM + PostgreSQL
- Biome for linting, TypeScript 6.0
- Svelte 5 Runes ($state, $derived, $effect, $props())
- Stores use getter-based return pattern (see relaySocket.svelte.ts)
- Components use SectionCard for consistent card layout
- Tailwind v4 with custom theme tokens (dark-bg, dark-card, dark-surface, dark-border, accent, accent-dim, text-primary, text-secondary, text-muted, warning, etc.)

Project docs are in docs/. Key references:
- docs/features/phase-12-nip66-passive-monitoring.md — Feature spec
- docs/development/style-guide.md — Code conventions
- docs/architecture/overview.md — System architecture
- docs/architecture/database.md — Schema reference
- docs/api/endpoints.md — API patterns
- docs/features/nip-reference.md — NIP-66 event structure
- docs/prompts/best-practices.md — Prompt guidelines
```

---

## Implementation Order

Prompts are numbered in build order. Each prompt is atomic — one verifiable change.

**Total estimated effort: ~6 hours**

**Build order:**
1. NIP-66 ingestor job (Prompt 1) — core new functionality
2. Schema + migration (Prompts 2-3) — drop tables
3. Environment config (Prompt 4) — new env var
4. API route updates (Prompts 5-7) — remove health_check references
5. Shared types (Prompt 8) — type contract change
6. Frontend updates (Prompts 9-10) — use NIP-66 data
7. Entry point + cleanup (Prompt 11) — wire everything together
8. Documentation (Prompt 12) — update docs

---

### Prompt 1: Create NIP-66 Ingestor Job

Create `apps/api/src/jobs/nip66Ingestor.ts` — the WebSocket subscriber that replaces the active relay monitor.

This file replaces `apps/api/src/jobs/relayMonitor.ts`. It connects to known NIP-66 monitor relays, subscribes to `kind:30166` events, parses their tags, and upserts into `relay_discoveries`.

```typescript
// apps/api/src/jobs/nip66Ingestor.ts

import { WebSocket } from 'ws';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { relayDiscovered, relays } from '../db/schema';
import { RelayDiscoverySchema } from '@relayscope/shared/schemas';
import { getServerEnv } from '@relayscope/env/server';
import { assertSafeUrl } from '../lib/ssrf';

// ─── Known NIP-66 Monitor Relays ───

const DEFAULT_MONITOR_RELAYS = [
  'wss://relay-monitor.migalmoreno.com',
];

// ─── Tag Parsing ───

interface ParsedDiscovery {
  relayUrl: string;
  rttOpen: number | null;
  rttRead: number | null;
  rttWrite: number | null;
  networkType: string | null;
  relayType: string | null;
  supportedNips: number[];
  requirements: string[];
  topics: string[];
  geohash: string | null;
}

function parseTags(tags: string[][]): ParsedDiscovery | null {
  let relayUrl: string | null = null;
  const rttOpen = parseRtt(tags, 'rtt-open');
  const rttRead = parseRtt(tags, 'rtt-read');
  const rttWrite = parseRtt(tags, 'rtt-write');
  const supportedNips: number[] = [];
  const requirements: string[] = [];
  const topics: string[] = [];
  let networkType: string | null = null;
  let relayType: string | null = null;
  let geohash: string | null = null;

  for (const tag of tags) {
    if (tag.length < 2) continue;
    const [key, value] = tag;

    switch (key) {
      case 'd':
        relayUrl = value;
        break;
      case 'n':
        networkType = value;
        break;
      case 'T':
        relayType = value;
        break;
      case 'N': {
        const nip = Number.parseInt(value, 10);
        if (!Number.isNaN(nip)) supportedNips.push(nip);
        break;
      }
      case 'R':
        requirements.push(value);
        break;
      case 't':
        topics.push(value);
        break;
      case 'g':
        geohash = value;
        break;
    }
  }

  if (!relayUrl) return null;

  return {
    relayUrl: relayUrl.replace(/\/+$/, ''),
    rttOpen,
    rttRead,
    rttWrite,
    networkType,
    relayType,
    supportedNips,
    requirements,
    topics,
    geohash,
  };
}

function parseRtt(tags: string[][], key: string): number | null {
  for (const tag of tags) {
    if (tag[0] === key && tag[1]) {
      const ms = Number.parseInt(tag[1], 10);
      if (!Number.isNaN(ms) && ms >= 0 && ms <= 120_000) return ms;
    }
  }
  return null;
}

// ─── Ingestion ───

function log(entry: { level: 'info' | 'warn' | 'error'; msg: string; [key: string]: unknown }) {
  process.stderr.write(
    `${JSON.stringify({ ...entry, timestamp: new Date().toISOString() })}\n`,
  );
}

async function ingestDiscoveryEvent(event: unknown): Promise<void> {
  const parsed = RelayDiscoverySchema.safeParse(event);
  if (!parsed.success) return;

  const { pubkey, tags, created_at } = parsed.data;
  const discovery = parseTags(tags);
  if (!discovery) return;

  // SSRF check on the relay URL
  try {
    assertSafeUrl(discovery.relayUrl);
  } catch {
    return;
  }

  // Upsert into relay_discoveries
  await db
    .insert(relayDiscovered)
    .values({
      relayUrl: discovery.relayUrl,
      monitorPubkey: pubkey,
      rttOpen: discovery.rttOpen,
      rttRead: discovery.rttRead,
      rttWrite: discovery.rttWrite,
      networkType: discovery.networkType,
      relayType: discovery.relayType,
      supportedNips: discovery.supportedNips,
      requirements: discovery.requirements,
      topics: discovery.topics,
      geohash: discovery.geohash,
      discoveredAt: new Date(created_at * 1000),
    })
    .onConflictDoUpdate({
      target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
      set: {
        rttOpen: discovery.rttOpen,
        rttRead: discovery.rttRead,
        rttWrite: discovery.rttWrite,
        networkType: discovery.networkType,
        relayType: discovery.relayType,
        supportedNips: discovery.supportedNips,
        requirements: discovery.requirements,
        topics: discovery.topics,
        geohash: discovery.geohash,
        discoveredAt: new Date(created_at * 1000),
      },
    });

  // Auto-create relay record if new
  const [existing] = await db
    .select({ id: relays.id })
    .from(relays)
    .where(eq(relays.url, discovery.relayUrl))
    .limit(1);

  if (!existing) {
    await db.insert(relays).values({ url: discovery.relayUrl });
  }
}

// ─── WebSocket Connection ───

function connectToMonitor(url: string): void {
  let reconnectDelay = 1000;

  function connect() {
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
    } catch {
      log({ level: 'error', msg: 'Failed to create WebSocket', url });
      scheduleReconnect();
      return;
    }

    ws.on('open', () => {
      reconnectDelay = 1000;
      log({ level: 'info', msg: 'Connected to monitor relay', url });
      ws.send(JSON.stringify(['REQ', 'nip66-sub', { kinds: [30166] }]));
    });

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (Array.isArray(msg) && msg[0] === 'EVENT' && msg[2]?.kind === 30166) {
          await ingestDiscoveryEvent(msg[2]);
        }
      } catch {
        // Non-critical: skip malformed messages
      }
    });

    ws.on('error', (err) => {
      log({ level: 'warn', msg: 'Monitor relay error', url, error: String(err) });
    });

    ws.on('close', () => {
      log({ level: 'warn', msg: 'Monitor relay disconnected', url });
      scheduleReconnect();
    });

    function scheduleReconnect() {
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        connect();
      }, reconnectDelay);
    }
  }

  connect();
}

// ─── Retention Cleanup ───

let lastRetentionRun: Date | null = null;

async function runRetentionCleanup(): Promise<void> {
  if (lastRetentionRun) {
    const hoursSince = (Date.now() - lastRetentionRun.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return;
  }

  try {
    const { sql } = await import('drizzle-orm');

    await db.execute(
      sql`DELETE FROM relay_info_snapshots WHERE fetched_at < NOW() - INTERVAL '180 days'`,
    );
    await db.execute(
      sql`DELETE FROM relay_discoveries WHERE discovered_at < NOW() - INTERVAL '180 days'`,
    );
    await db.execute(
      sql`DELETE FROM relay_events WHERE received_at < NOW() - INTERVAL '30 days'`,
    );

    lastRetentionRun = new Date();
    log({ level: 'info', msg: 'Retention cleanup completed' });
  } catch {
    log({ level: 'error', msg: 'Retention cleanup failed' });
  }
}

// ─── Entry Point ───

export function startNip66Ingestor(): void {
  const env = getServerEnv();
  const monitorUrls = env.MONITOR_RELAYS
    ? env.MONITOR_RELAYS.split(',').map((u) => u.trim()).filter(Boolean)
    : DEFAULT_MONITOR_RELAYS;

  log({ level: 'info', msg: 'Starting NIP-66 ingestor', monitors: monitorUrls });

  for (const url of monitorUrls) {
    connectToMonitor(url);
  }

  // Run retention cleanup once after 60s, then daily
  setTimeout(() => {
    runRetentionCleanup();
    setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
  }, 60_000);
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 2: Drop health_checks and monitoring_jobs Tables — Migration

Create a Drizzle migration SQL file to drop the two tables.

First, generate the migration:

```bash
cd apps/api && bun run db:generate
```

Then create the migration file manually. Check the latest migration timestamp in `apps/api/drizzle/` and create a new file with the next sequence number:

```sql
-- apps/api/drizzle/XXXX_drop_health_checks_and_monitoring_jobs.sql

-- Drop health_checks table (replaced by relay_discoveries with monitorPubkey='self')
DROP TABLE IF EXISTS health_checks CASCADE;

-- Drop monitoring_jobs table (unused — monitor bypassed this table)
DROP TABLE IF EXISTS monitoring_jobs CASCADE;
```

After making changes, verify the migration was generated:
1. `ls apps/api/drizzle/` — confirm the new file exists

---

### Prompt 3: Remove Tables from Schema

Edit `apps/api/src/db/schema.ts` to remove the `healthChecks` and `monitoringJobs` tables, their indexes, relations, and type exports.

**Remove these sections:**

1. The `healthChecks` table definition (lines ~63-84):
```typescript
// DELETE: the entire healthChecks pgTable block
```

2. The `monitoringJobs` table definition (lines ~110-126):
```typescript
// DELETE: the entire monitoringJobs pgTable block
```

3. From `defineRelations`, remove:
```typescript
// In the object passed to defineRelations(), remove:
healthChecks: r.many.healthChecks(),
monitoringJob: r.one.monitoringJobs(),

// In the healthChecks relation block, remove:
healthChecks: {
  relay: r.one.relays({
    from: r.healthChecks.relayId,
    to: r.relays.id,
  }),
},

// In the monitoringJobs relation block, remove:
monitoringJobs: {
  relay: r.one.relays({
    from: r.monitoringJobs.relayId,
    to: r.relays.id,
  }),
},
```

4. Remove the type exports (lines ~213-214):
```typescript
// DELETE these lines:
export type HealthCheck = typeof healthChecks.$inferSelect;
export type MonitoringJob = typeof monitoringJobs.$inferSelect;
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 4: Update Environment Config

Edit `packages/config/env/src/server.ts` to add `MONITOR_RELAYS` and remove `MONITOR_INTERVAL_MS`.

```typescript
// Before
MONITOR_INTERVAL_MS: z.coerce.number().int().min(1000).default(60000),

// After
MONITOR_RELAYS: z.string().optional(),
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 5: Update Relays Route — Remove health_checks Joins

Edit `apps/api/src/routes/relays.ts` to remove all `healthChecks` references.

**Changes:**

1. Remove the `healthChecks` import:
```typescript
// Remove from imports:
import { healthChecks, ... } from '../db/schema';
```

2. In the relay list endpoint, remove the health check fetch and join. The relay list should no longer include `lastHealthCheck`:

```typescript
// Before: fetches health checks and attaches lastHealthCheck
// After: simply return relays without lastHealthCheck
const data = paginatedRelays.map((relay) => ({
  ...relay,
}));
```

3. In the single relay detail endpoint, remove the `leftJoin(healthChecks, ...)`:

```typescript
// Before
const [result] = await db
  .select({ relay: relays, lastHealthCheck: healthChecks })
  .from(relays)
  .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
  .where(eq(relays.id, id))
  .limit(1);

// After
const [result] = await db
  .select()
  .from(relays)
  .where(eq(relays.id, id))
  .limit(1);
```

4. **Rewrite** the `POST /api/relays/:id/check` endpoint to store in `relay_discoveries` instead of `health_checks`:

```typescript
// Replace the healthChecks.insert with relayDiscovered.insert
await db
  .insert(relayDiscovered)
  .values({
    relayUrl: relay.url,
    monitorPubkey: 'self', // first-party on-demand check
    rttOpen: latencyMs,
    // ... other fields from probe results
  })
  .onConflictDoUpdate({
    target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
    set: {
      rttOpen: latencyMs,
      discoveredAt: new Date(),
    },
  });
```

5. Remove the `GET /api/relays/:id/history` endpoint entirely (health check history is no longer applicable).

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 6: Update Directory Route — Use NIP-66 Data

Edit `apps/api/src/routes/directory.ts` to replace `healthChecks` with `relay_discoveries` data.

**Changes:**

1. Replace the `healthChecks` import with `relayDiscovered`:
```typescript
// Before
import { healthChecks, ... } from '../db/schema';

// After
import { relayDiscovered, ... } from '../db/schema';
```

2. Rewrite `toDirectoryRelay()` to use NIP-66 data:

```typescript
function toDirectoryRelay(
  relay: typeof relays.$inferSelect,
  discovery: typeof relayDiscovered.$inferSelect | null,
) {
  return {
    id: relay.id,
    url: relay.url,
    name: relay.name,
    description: relay.description,
    supportedNips: relay.supportedNips,
    isPublic: relay.isPublic,
    country: relay.country,
    createdAt: relay.createdAt,
    updatedAt: relay.updatedAt,
    lastDiscovery: discovery
      ? {
          rttOpen: discovery.rttOpen,
          rttRead: discovery.rttRead,
          rttWrite: discovery.rttWrite,
          networkType: discovery.networkType,
          discoveredAt: discovery.discoveredAt,
        }
      : null,
  };
}
```

3. Replace the health check fetch pattern with a relay_discoveries fetch:

```typescript
// Before: fetches health checks after pagination
// After: fetches latest discovery per relay
const relayUrls = paginatedRelays.map((r) => r.url);
const allDiscoveries = await db
  .select()
  .from(relayDiscovered)
  .where(inArray(relayDiscovered.relayUrl, relayUrls))
  .orderBy(desc(relayDiscovered.discoveredAt));

const discoveryMap = new Map<string, typeof relayDiscovered.$inferSelect>();
for (const d of allDiscoveries) {
  if (!discoveryMap.has(d.relayUrl)) {
    discoveryMap.set(d.relayUrl, d);
  }
}
```

4. Fix the latency sort — now sorts by `rtt_open` from the latest discovery:

```typescript
case 'latency': {
  // Sort by rtt_open from latest discovery (nulls last)
  const sorted = [...paginatedRelays].sort((a, b) => {
    const dA = discoveryMap.get(a.url);
    const dB = discoveryMap.get(b.url);
    const rttA = dA?.rttOpen ?? Number.MAX_SAFE_INTEGER;
    const rttB = dB?.rttOpen ?? Number.MAX_SAFE_INTEGER;
    return filters.sortOrder === 'desc' ? rttB - rttA : rttA - rttB;
  });
  return sorted.map((r) => toDirectoryRelay(r, discoveryMap.get(r.url) ?? null));
}
```

5. Update the comparison endpoint to use `relay_discoveries` data for `latencyWinner` and `healthWinner`.

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 7: Update Discover Route — Remove POST Endpoint

Edit `apps/api/src/routes/discover.ts` to remove the `POST /:id/discoveries` endpoint. The server now ingests directly from monitor relays.

**Changes:**

1. Remove the entire `POST /:id/discoveries` handler (lines ~49-97).
2. Remove the `requireApiKey` import if it's no longer used.
3. Remove the `createDiscoverySchema` import if it's no longer used.
4. Keep only the `GET /:id/discoveries` endpoint.

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 8: Update Shared Types

Edit `packages/shared/src/types.ts` to remove `HealthCheck` and update `DirectoryRelay`.

**Changes:**

1. Remove the `HealthCheck` interface:
```typescript
// DELETE the entire HealthCheck interface (lines ~94-104)
export interface HealthCheck {
  id: string;
  relayId: string;
  httpReachable: boolean;
  corsConfigured: boolean;
  websocketConnectable: boolean;
  latencyMs: number | null;
  httpStatusCode: number | null;
  errorMessage: string | null;
  checkedAt: Date;
}
```

2. Update `DirectoryRelay` to replace `lastHealthCheck` with `lastDiscovery`:

```typescript
// Before
export interface DirectoryRelay {
  // ... fields ...
  lastHealthCheck: {
    httpReachable: boolean;
    corsConfigured: boolean;
    websocketConnectable: boolean;
    latencyMs: number | null;
    checkedAt: Date;
  } | null;
}

// After
export interface DirectoryRelay {
  // ... fields ...
  lastDiscovery: {
    rttOpen: number | null;
    rttRead: number | null;
    rttWrite: number | null;
    networkType: string | null;
    discoveredAt: Date;
  } | null;
}
```

3. Update `ComparisonDiff` if it references `HealthCheck` types.

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 9: Update RelayCard — Use NIP-66 Data

Edit `apps/web/src/components/RelayCard.svelte` to use `lastDiscovery` instead of `lastHealthCheck`.

**Changes:**

Replace the derived state:

```typescript
// Before
const isOnline = $derived(
  relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable,
);
const latencyDisplay = $derived(
  relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—',
);

// After — "online" if discovered within last 24 hours
const isOnline = $derived(
  relay.lastDiscovery != null &&
  (Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime()) < 24 * 60 * 60 * 1000,
);
const latencyDisplay = $derived(
  relay.lastDiscovery?.rttOpen != null ? `${relay.lastDiscovery.rttOpen}ms` : '—',
);
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 10: Update ComparisonView — Use NIP-66 Data

Edit `apps/web/src/components/ComparisonView.svelte` to use `lastDiscovery` instead of `lastHealthCheck`.

**Changes:**

```typescript
// Before
function latencyDisplay(relay: DirectoryRelay): string {
  return relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—';
}

function healthStatus(relay: DirectoryRelay): string {
  if (relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable) {
    return 'Online';
  }
  return 'Offline';
}

// After
function latencyDisplay(relay: DirectoryRelay): string {
  return relay.lastDiscovery?.rttOpen != null ? `${relay.lastDiscovery.rttOpen}ms` : '—';
}

function healthStatus(relay: DirectoryRelay): string {
  if (
    relay.lastDiscovery != null &&
    (Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime()) < 24 * 60 * 60 * 1000
  ) {
    return 'Online';
  }
  return 'Unknown';
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 11: Update index.ts — Swap Monitor for Ingestor

Edit `apps/api/src/index.ts` to replace `startMonitor` with `startNip66Ingestor`.

**Changes:**

```typescript
// Before
import { startMonitor } from './jobs/relayMonitor';
// ... at bottom:
const monitorInterval = Math.max(10_000, env.MONITOR_INTERVAL_MS);
startMonitor(monitorInterval);

// After
import { startNip66Ingestor } from './jobs/nip66Ingestor';
// ... at bottom:
startNip66Ingestor();
```

Also remove the `MONITOR_INTERVAL_MS` reference.

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

### Prompt 12: Delete Old Monitor and Update Documentation

1. Delete the old monitor file:

```bash
rm apps/api/src/jobs/relayMonitor.ts
```

2. Update `docs/architecture/overview.md` — change the monitor description:

```markdown
# Before
MON["🔄 Monitor Job<br/>Background Scheduler"]

# After
MON["🔄 NIP-66 Ingestor<br/>Passive Monitor Subscriber"]
```

3. Update `docs/architecture/overview.md` — change the monitoring flow description to reflect NIP-66 passive ingestion instead of active probing.

4. Update `docs/README.md` — add `phase-12-nip66-passive-monitoring.md` to the features list.

5. Update `docs/roadmap.md` — add Phase 12 status:

```markdown
Phase 12 ████████████████████  NIP-66 Passive Monitoring          📋 Planned
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

## Verification Checklist

After all prompts are complete, run the full verification suite:

```bash
# Lint
bun run lint

# Type check all packages
bun run type-check

# Build all packages
bun run build
```

### Manual Testing

1. Start the dev server: `bun run dev`
2. Check server logs — confirm "Starting NIP-66 ingestor" message appears
3. Confirm "Connected to monitor relay" message appears (if monitor is reachable)
4. Verify the directory page loads without errors
5. Verify RelayCard shows NIP-66 data (online status, latency)
6. Verify the comparison view works with NIP-66 data
7. Test on-demand check: `POST /api/relays/:id/check` should write to `relay_discoveries` with `monitorPubkey = 'self'`
8. Confirm no references to `health_checks` or `monitoring_jobs` remain in code

---

*Last updated: v0.9.0 — 2026-07-04*
