# 🤖 Phase 7: NIP Compliance & Protocol Modernization — Implementation Prompts

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
- docs/features/phase-7-nip-compliance.md — Feature spec
- docs/development/style-guide.md — Code conventions
- docs/architecture/database.md — Schema
- docs/prompts/best-practices.md — Prompt guidelines
```

---

## Implementation Order

Prompts are numbered in build order. Each prompt is atomic — one verifiable change.

---

### Prompt 1: Add NIP-11 Types to Shared Package

Update `packages/shared/src/types.ts` to modernize NIP-11 types and add new NIP types.

**Changes:**

1. **Update `RelayNip11`** — add missing fields:
```typescript
export interface RelayNip11 {
  name?: string;
  description?: string;
  banner?: string;              // NEW: Relay banner image URL
  icon?: string;
  pubkey?: string;              // NEW: Admin contact pubkey (32-byte hex)
  self?: string;                // NEW: Relay's own identity pubkey
  contact?: string;             // NEW: Contact URI (mailto, https)
  supported_nips?: number[];
  software?: string;
  version?: string;
  terms_of_service?: string;    // NEW: Link to ToS document
  limitation?: RelayLimitation;
  payments_url?: string;        // NEW: Payment portal URL
  fees?: RelayFees;             // NEW: Structured fee schedule
}
```

2. **Add new fee types** (after `RelayLimitation`):
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

3. **Add NIP-66 types** (after `DiscoveryResult`):
```typescript
export interface RelayDiscovery {
  id: string;
  relayUrl: string;
  monitorPubkey: string;
  rttOpen: number | null;
  rttRead: number | null;
  rttWrite: number | null;
  networkType: string | null;     // 'clearnet', 'tor', 'i2p', 'loki'
  relayType: string | null;       // PascalCase enum
  supportedNips: number[];
  requirements: string[];         // ['auth', '!payment', 'pow']
  topics: string[];
  geohash: string | null;
  discoveredAt: Date;
}

export interface RelayDiscoveryEvent {
  kind: 30166;
  tags: string[][];
  content: string;
  pubkey: string;
  created_at: number;
}
```

4. **Add NIP-65 types**:
```typescript
export interface RelayListEntry {
  id: string;
  authorPubkey: string;
  relayUrl: string;
  marker: string | null;    // 'read', 'write', or null (both)
  listedAt: Date;
}

export interface RelayListEvent {
  kind: 10002;
  tags: string[][];
  content: string;
  pubkey: string;
  created_at: number;
}

export interface RelayPopularity {
  readCount: number;
  writeCount: number;
  readers: string[];
  writers: string[];
}
```

5. **Add NIP-67 types**:
```typescript
export type EoseHint = 'finish' | 'more';

export interface EoseResult {
  subscriptionId: string;
  hints: EoseHint[];
  complete: boolean;
  hasMore: boolean;
}
```

6. **Add NIP-40 types**:
```typescript
export interface ExpirationInfo {
  isExpired: boolean;
  expiresAt: Date | null;
  remainingMs: number | null;
}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 2: Add Zod Validation Schemas to Shared Package

Create `packages/shared/src/schemas.ts` with Zod schemas for NIP protocol data.

```typescript
import { z } from 'zod';

// ─── NIP-11 Schemas ───

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
}).passthrough();

// ─── NIP-01 Event Schema ───

export const NostrEventSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
  created_at: z.number().int().min(0),
  kind: z.number().int().min(0),
  tags: z.array(z.array(z.string().nullable()).min(1)),
  content: z.string(),
  sig: z.string().regex(/^[0-9a-f]{128}$/),
});

// ─── NIP-66 Discovery Schema ───

export const RelayDiscoverySchema = z.object({
  kind: z.literal(30166),
  tags: z.array(z.array(z.string())),
  content: z.string(),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
  created_at: z.number().int(),
}).passthrough();

// ─── NIP-65 Relay List Schema ───

export const RelayListEventSchema = z.object({
  kind: z.literal(10002),
  tags: z.array(z.array(z.string())),
  content: z.string(),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
  created_at: z.number().int(),
}).passthrough();

// ─── NIP-42 Auth Event Schema ───

export const AuthEventSchema = z.object({
  kind: z.literal(22242),
  content: z.literal(''),
  tags: z.array(z.array(z.string())),
  created_at: z.number().int(),
}).passthrough();

// ─── Pagination Schema ───

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'url', 'lastChecked', 'latency']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
```

Also add zod as a dependency to `packages/shared/package.json`:
```json
"dependencies": {
  "zod": "^4.4.3"
}
```

After making changes, run:
1. `bun install`
2. `bun run lint`
3. `bun run type-check`

---

### Prompt 3: Update Database Schema for Phase 7

Update `apps/api/src/db/schema.ts` to add new tables and columns.

**Add new columns to `relays` table:**
```typescript
// Add after existing columns in relays table
banner: text('banner'),
pubkey: text('pubkey'),
self: text('self'),
contact: text('contact'),
terms_of_service: text('terms_of_service'),
payments_url: text('payments_url'),
fees: jsonb('fees'),  // RelayFees JSON
```

**Add new table `relay_discoveries`:**
```typescript
export const relayDiscovered = pgTable('relay_discoveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  relayUrl: text('relay_url').notNull(),
  monitorPubkey: text('monitor_pubkey').notNull(),
  rttOpen: integer('rtt_open'),
  rttRead: integer('rtt_read'),
  rttWrite: integer('rtt_write'),
  networkType: text('network_type'),
  relayType: text('relay_type'),
  supportedNips: integer('supported_nips').array().default([]),
  requirements: text('requirements').array().default([]),
  topics: text('topics').array().default([]),
  geohash: text('geohash'),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('relay_discoveries_url_monitor_key').on(t.relayUrl, t.monitorPubkey),
]);
```

**Add new table `relay_list_entries`:**
```typescript
export const relayListEntries = pgTable('relay_list_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorPubkey: text('author_pubkey').notNull(),
  relayUrl: text('relay_url').notNull(),
  marker: text('marker'),  // 'read', 'write', or null
  listedAt: timestamp('listed_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('relay_list_entries_author_relay_key').on(t.authorPubkey, t.relayUrl),
]);
```

**Add column to `healthChecks` table:**
```typescript
// Add after existing columns
nip67EoseHints: jsonb('nip67_eose_hints'),  // EoseResult JSON
```

After making changes, run:
1. `bun run lint`
2. `bun run db:generate`
3. `bun run type-check`

---

### Prompt 4: Generate and Push Database Migration

Run the database migration to apply schema changes.

```bash
cd apps/api && bun run db:push --force
```

Verify the migration succeeded by checking for errors.

---

### Prompt 5: Add Discovery API Endpoint

Create `apps/api/src/routes/discover.ts` for NIP-66 discovery data.

```typescript
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayDiscovered, relays } from '../db/schema';
import { requireApiKey } from '../middleware/auth';

const discoverRoutes = new Hono();

// ─── GET /api/relays/:id/discoveries — Get monitor observations for a relay ───
discoverRoutes.get('/:id/discoveries', async (c) => {
  const relayId = c.req.param('id');

  // Verify relay exists
  const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const discoveries = await db
    .select()
    .from(relayDiscovered)
    .where(eq(relayDiscovered.relayUrl, relay.url))
    .orderBy(sql`${relayDiscovered.discoveredAt} DESC`)
    .limit(50);

  // Aggregate stats
  const monitorCount = new Set(discoveries.map((d) => d.monitorPubkey)).size;
  const avgRttOpen = discoveries.reduce((sum, d) => sum + (d.rttOpen || 0), 0) / discoveries.length || null;
  const avgRttRead = discoveries.reduce((sum, d) => sum + (d.rttRead || 0), 0) / discoveries.length || null;
  const avgRttWrite = discoveries.reduce((sum, d) => sum + (d.rttWrite || 0), 0) / discoveries.length || null;

  return c.json({
    success: true,
    data: {
      discoveries,
      stats: {
        monitorCount,
        avgRttOpen: avgRttOpen ? Math.round(avgRttOpen) : null,
        avgRttRead: avgRttRead ? Math.round(avgRttRead) : null,
        avgRttWrite: avgRttWrite ? Math.round(avgRttWrite) : null,
      },
    },
  });
});

// ─── POST /api/relays/:id/discoveries — Upsert discovery from monitor ───
discoverRoutes.post('/:id/discoveries', requireApiKey, async (c) => {
  const relayId = c.req.param('id');
  const body = await c.req.json();

  const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const {
    monitorPubkey,
    rttOpen,
    rttRead,
    rttWrite,
    networkType,
    relayType,
    supportedNips,
    requirements,
    topics,
    geohash,
  } = body;

  if (!monitorPubkey) {
    return c.json({ success: false, error: 'monitorPubkey is required' }, 400);
  }

  // Upsert discovery
  const [result] = await db
    .insert(relayDiscovered)
    .values({
      relayUrl: relay.url,
      monitorPubkey,
      rttOpen: rttOpen ?? null,
      rttRead: rttRead ?? null,
      rttWrite: rttWrite ?? null,
      networkType: networkType ?? null,
      relayType: relayType ?? null,
      supportedNips: supportedNips ?? [],
      requirements: requirements ?? [],
      topics: topics ?? [],
      geohash: geohash ?? null,
    })
    .onConflictDoUpdate({
      target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
      set: {
        rttOpen: rttOpen ?? null,
        rttRead: rttRead ?? null,
        rttWrite: rttWrite ?? null,
        networkType: networkType ?? null,
        relayType: relayType ?? null,
        supportedNips: supportedNips ?? [],
        requirements: requirements ?? [],
        topics: topics ?? [],
        geohash: geohash ?? null,
        discoveredAt: new Date(),
      },
    })
    .returning();

  return c.json({ success: true, data: result }, 201);
});

export default discoverRoutes;
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 6: Add Popularity API Endpoint

Create `apps/api/src/routes/popularity.ts` for NIP-65 relay list data.

```typescript
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayListEntries, relays } from '../db/schema';

const popularityRoutes = new Hono();

// ─── GET /api/relays/:id/popularity — Get read/write relay counts ───
popularityRoutes.get('/:id/popularity', async (c) => {
  const relayId = c.req.param('id');

  // Verify relay exists
  const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  // Count read entries
  const [{ readCount }] = await db
    .select({ readCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'read' OR ${relayListEntries.marker} IS NULL)`);

  // Count write entries
  const [{ writeCount }] = await db
    .select({ writeCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'write' OR ${relayListEntries.marker} IS NULL)`);

  // Get sample readers
  const readers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'read' OR ${relayListEntries.marker} IS NULL)`)
    .limit(10);

  // Get sample writers
  const writers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'write' OR ${relayListEntries.marker} IS NULL)`)
    .limit(10);

  return c.json({
    success: true,
    data: {
      readCount,
      writeCount,
      readers: readers.map((r) => r.authorPubkey),
      writers: writers.map((w) => w.authorPubkey),
    },
  });
});

// ─── POST /api/relays/:id/popularity — Upsert relay list entry ───
popularityRoutes.post('/:id/popularity', async (c) => {
  const relayId = c.req.param('id');
  const body = await c.req.json();

  const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const { authorPubkey, marker } = body;

  if (!authorPubkey) {
    return c.json({ success: false, error: 'authorPubkey is required' }, 400);
  }

  const [result] = await db
    .insert(relayListEntries)
    .values({
      authorPubkey,
      relayUrl: relay.url,
      marker: marker ?? null,
    })
    .onConflictDoUpdate({
      target: [relayListEntries.authorPubkey, relayListEntries.relayUrl],
      set: {
        marker: marker ?? null,
        listedAt: new Date(),
      },
    })
    .returning();

  return c.json({ success: true, data: result }, 201);
});

export default popularityRoutes;
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 7: Mount New Routes in API

Edit `apps/api/src/index.ts` to mount the new discovery and popularity routes.

**Add imports:**
```typescript
import discoverRoutes from './routes/discover';
import popularityRoutes from './routes/popularity';
```

**Add route mounts after existing routes:**
```typescript
app.route('/api/relays', discoverRoutes);
app.route('/api/relays', popularityRoutes);
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`
3. `bun run build`

---

### Prompt 8: Add NIP-67 EOSE Hints to Frontend

Update `apps/web/src/lib/stores/relaySocket.svelte.ts` to parse NIP-67 EOSE hints.

**Add at top of file:**
```typescript
import type { EoseResult } from '@relayscope/shared';
```

**Add state after `eose` state:**
```typescript
let eoseHints = $state<EoseResult | null>(null);
```

**Update `socket.onmessage` handler to parse EOSE with hints:**
```typescript
// In the EOSE handling section, replace existing code:
if (Array.isArray(parsed) && parsed[0] === 'EOSE') {
  const subscriptionId = parsed[1] as string;
  const hints = parsed.slice(2) as string[];

  eoseReceived = true;
  eose = {
    received: true,
    historicalCount: events.length,
    liveCount: 0,
  };

  // NIP-67: Parse hints
  const parsedHints: ('finish' | 'more')[] = hints.map((h) =>
    h === 'finish' || h === 'more' ? h : 'more'
  );
  eoseHints = {
    subscriptionId,
    hints: parsedHints,
    complete: parsedHints.includes('finish'),
    hasMore: parsedHints.includes('more'),
  };
}
```

**Add to return object:**
```typescript
get eoseHints() { return eoseHints; },
```

**Add to `resetState`:**
```typescript
eoseHints = null;
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 9: Create `EoseIndicator` Component

Create `apps/web/src/components/EoseIndicator.svelte`.

```svelte
<script lang="ts">
import type { EoseResult } from '@relayscope/shared';

let { eoseResult }: { eoseResult: EoseResult | null } = $props();
</script>

{#if eoseResult}
  <div
    class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all
    {eoseResult.complete
      ? 'bg-success/10 border border-success/20 text-success'
      : 'bg-warning/10 border border-warning/20 text-warning'}"
  >
    {#if eoseResult.complete}
      <span>✓</span>
      <span>All stored events received</span>
    {:else}
      <span>⚠</span>
      <span>More events available — use older filters to paginate</span>
    {/if}
  </div>
{/if}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 10: Create `MonitorDataPanel` Component

Create `apps/web/src/components/MonitorDataPanel.svelte`.

```svelte
<script lang="ts">
import type { RelayDiscovery } from '@relayscope/shared';

let { discoveries, stats }: {
  discoveries: RelayDiscovery[];
  stats: {
    monitorCount: number;
    avgRttOpen: number | null;
    avgRttRead: number | null;
    avgRttWrite: number | null;
  };
} = $props();
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h4 class="text-xs font-semibold text-text-primary">Monitor Observations</h4>
    <span class="text-[10px] text-text-muted">
      {stats.monitorCount} monitor{stats.monitorCount !== 1 ? 's' : ''}
    </span>
  </div>

  <!-- Aggregate Stats -->
  <div class="grid grid-cols-3 gap-2">
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Open RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttOpen != null ? `${stats.avgRttOpen}ms` : '—'}
      </p>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Read RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttRead != null ? `${stats.avgRttRead}ms` : '—'}
      </p>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Write RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttWrite != null ? `${stats.avgRttWrite}ms` : '—'}
      </p>
    </div>
  </div>

  <!-- Individual Observations -->
  {#if discoveries.length > 0}
    <div class="space-y-1 max-h-48 overflow-y-auto">
      {#each discoveries.slice(0, 5) as discovery (discovery.id)}
        <div class="flex items-center justify-between px-2 py-1.5 rounded bg-dark-surface/50 text-[10px]">
          <span class="text-text-muted font-mono truncate max-w-[120px]">
            {discovery.monitorPubkey.slice(0, 8)}…
          </span>
          <div class="flex items-center gap-2 text-text-muted">
            {#if discovery.rttOpen}
              <span>O:{discovery.rttOpen}ms</span>
            {/if}
            {#if discovery.networkType}
              <span class="px-1 py-0.5 rounded bg-dark-border text-text-secondary">
                {discovery.networkType}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-[10px] text-text-muted text-center py-2">No monitor observations yet</p>
  {/if}
</div>
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 11: Create `RelayListBadge` Component

Create `apps/web/src/components/RelayListBadge.svelte`.

```svelte
<script lang="ts">
let { readCount, writeCount }: {
  readCount: number;
  writeCount: number;
} = $props();
</script>

<div class="flex items-center gap-3 text-[10px] text-text-muted">
  {#if readCount > 0}
    <span class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
      {readCount} read{readCount !== 1 ? 's' : ''}
    </span>
  {/if}
  {#if writeCount > 0}
    <span class="flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
      {writeCount} write{writeCount !== 1 ? 's' : ''}
    </span>
  {/if}
  {#if readCount === 0 && writeCount === 0}
    <span class="text-text-muted">Not listed in any relay lists</span>
  {/if}
</div>
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 12: Create `FeeDisplay` Component

Create `apps/web/src/components/FeeDisplay.svelte` (replaces old FeeDisplay).

```svelte
<script lang="ts">
import type { RelayFees } from '@relayscope/shared';

let { fees }: { fees: RelayFees | null } = $props();

function formatAmount(amount: number, unit: string): string {
  if (unit === 'msats') {
    return `${(amount / 1000).toFixed(2)} sats`;
  }
  return `${amount} sats`;
}
</script>

{#if fees}
  <div class="space-y-2">
    {#if fees.admission && fees.admission.length > 0}
      <div>
        <p class="text-[10px] text-text-muted mb-1">Admission Fee</p>
        {#each fees.admission as entry (entry.amount)}
          <p class="text-xs text-text-primary">
            {formatAmount(entry.amount, entry.unit)}
            {#if entry.period}
              <span class="text-text-muted">/ {entry.period}s</span>
            {/if}
          </p>
        {/each}
      </div>
    {/if}

    {#if fees.subscription && fees.subscription.length > 0}
      <div>
        <p class="text-[10px] text-text-muted mb-1">Subscription Fee</p>
        {#each fees.subscription as entry (entry.amount)}
          <p class="text-xs text-text-primary">
            {formatAmount(entry.amount, entry.unit)}
            {#if entry.period}
              <span class="text-text-muted">/ {entry.period}s</span>
            {/if}
          </p>
        {/each}
      </div>
    {/if}

    {#if fees.publication && fees.publication.length > 0}
      <div>
        <p class="text-[10px] text-text-muted mb-1">Publication Fee</p>
        {#each fees.publication as entry (entry.amount)}
          <p class="text-xs text-text-primary">
            {formatAmount(entry.amount, entry.unit)}
            {#if entry.kinds}
              <span class="text-text-muted"> (kinds: {entry.kinds.join(', ')})</span>
            {/if}
          </p>
        {/each}
      </div>
    {/if}
  </div>
{/if}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 13: Create `ExpiredBadge` Component

Create `apps/web/src/components/ExpiredBadge.svelte`.

```svelte
<script lang="ts">
import type { ExpirationInfo } from '@relayscope/shared';

let { expirationInfo }: { expirationInfo: ExpirationInfo | null } = $props();

function formatRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
</script>

{#if expirationInfo?.isExpired}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-error/10 border border-error/20 text-error">
    <span>⚠</span>
    <span>Expired</span>
  </span>
{:else if expirationInfo?.expiresAt}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-warning/10 border border-warning/20 text-warning">
    <span>⏰</span>
    <span>Expires in {formatRemaining(expirationInfo.remainingMs!)}</span>
  </span>
{/if}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 14: Create `AuthPrefixDisplay` Component

Create `apps/web/src/components/AuthPrefixDisplay.svelte`.

```svelte
<script lang="ts">
let { message }: { message: string } = $props();

// Parse NIP-42 OK/CLOSED prefixes
const parsed = $derived(() => {
  if (message.startsWith('OK')) {
    const content = message.slice(2).trim();
    return { type: 'ok' as const, content };
  }
  if (message.startsWith('CLOSED')) {
    const content = message.slice(6).trim();
    return { type: 'closed' as const, content };
  }
  if (message.startsWith('auth-required:')) {
    const content = message.slice(14).trim();
    return { type: 'auth-required' as const, content };
  }
  if (message.startsWith('restricted:')) {
    const content = message.slice(10).trim();
    return { type: 'restricted' as const, content };
  }
  return { type: 'other' as const, content: message };
});
</script>

<span class="text-xs">
  {#if parsed().type === 'ok'}
    <span class="text-success">OK</span> {parsed().content}
  {:else if parsed().type === 'closed'}
    <span class="text-error">CLOSED</span> {parsed().content}
  {:else if parsed().type === 'auth-required'}
    <span class="text-warning">auth-required:</span> {parsed().content}
  {:else if parsed().type === 'restricted'}
    <span class="text-error">restricted:</span> {parsed().content}
  {:else}
    {message}
  {/if}
</span>
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 15: Add NIP-40 Expiration Helper

Add expiration detection utility to `apps/web/src/utils/relay.ts`.

**Add at end of file:**
```typescript
import type { ExpirationInfo } from '@relayscope/shared';

/**
 * Parse NIP-40 expiration tag from event tags.
 */
export function parseExpiration(tags: string[][]): ExpirationInfo {
  const expirationTag = tags.find(
    ([key, value]) => key === 'expiration' && value != null
  );

  if (!expirationTag || !expirationTag[1]) {
    return { isExpired: false, expiresAt: null, remainingMs: null };
  }

  const expiresAt = new Date(Number(expirationTag[1]) * 1000);
  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();

  return {
    isExpired: remainingMs <= 0,
    expiresAt,
    remainingMs: remainingMs > 0 ? remainingMs : 0,
  };
}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 16: Add NIP-42 Auth Event Verification

Add AUTH event verification helper to `apps/web/src/lib/composables/useNip42Auth.svelte.ts`.

**Add at end of file (before closing `}`):**

```typescript
/**
 * Verify AUTH event structure per NIP-42 spec.
 */
function verifyAuthEvent(
  event: { kind: number; tags: string[][]; created_at: number },
  challenge: string,
  relayUrl: string,
): boolean {
  if (event.kind !== 22242) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(event.created_at - now) > 600) return false;

  const challengeTag = event.tags.find(([k]) => k === 'challenge');
  if (!challengeTag || challengeTag[1] !== challenge) return false;

  const relayTag = event.tags.find(([k]) => k === 'relay');
  if (!relayTag) return false;

  try {
    const eventDomain = new URL(relayTag[1]).hostname;
    const expectedDomain = new URL(relayUrl).hostname;
    if (eventDomain !== expectedDomain) return false;
  } catch {
    return false;
  }

  return true;
}
```

**Add to return object:**
```typescript
verifyAuthEvent,
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 17: Create `useRelayDiscovery` Composable

Create `apps/web/src/lib/composables/useRelayDiscovery.svelte.ts`.

```typescript
import type { RelayDiscovery } from '@relayscope/shared';

const API_BASE = '/api/relays';

export function useRelayDiscovery() {
  let discoveries = $state<RelayDiscovery[]>([]);
  let stats = $state<{
    monitorCount: number;
    avgRttOpen: number | null;
    avgRttRead: number | null;
    avgRttWrite: number | null;
  } | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function fetchDiscoveries(relayId: string): Promise<void> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${API_BASE}/${relayId}/discoveries`, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch discoveries');
      }

      discoveries = json.data.discoveries;
      stats = json.data.stats;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to fetch discoveries';
    } finally {
      loading = false;
    }
  }

  function reset() {
    discoveries = [];
    stats = null;
    loading = false;
    error = null;
  }

  return {
    get discoveries() { return discoveries; },
    get stats() { return stats; },
    get loading() { return loading; },
    get error() { return error; },
    fetchDiscoveries,
    reset,
  };
}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 18: Update `RelayProfile` Component

Update `apps/web/src/components/RelayProfile.svelte` to show NIP-66, NIP-65, and fees.

**Add imports:**
```typescript
import type { RelayDiscovery, RelayPopularity } from '@relayscope/shared';
import MonitorDataPanel from './MonitorDataPanel.svelte';
import RelayListBadge from './RelayListBadge.svelte';
import FeeDisplay from './FeeDisplay.svelte';
import { useRelayDiscovery } from '../lib/composables/useRelayDiscovery.svelte';
```

**Add props:**
```typescript
let { relayId, relay, info }: {
  relayId: string;
  relay: any;
  info: any;
} = $props();
```

**Add composable:**
```typescript
const discovery = useRelayDiscovery();
let popularity = $state<RelayPopularity | null>(null);

// Fetch discovery and popularity data on mount
$effect(() => {
  if (relayId) {
    discovery.fetchDiscoveries(relayId);
    // Fetch popularity
    fetch(`/api/relays/${relayId}/popularity`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) popularity = json.data;
      })
      .catch(() => {});
  }
});
```

**Add new sections in the template after existing content:**

```svelte
<!-- Fees -->
{#if info.fees}
  <SectionCard>
    <FeeDisplay fees={info.fees} />
  </SectionCard>
{/if}

<!-- Popularity -->
{#if popularity && (popularity.readCount > 0 || popularity.writeCount > 0)}
  <SectionCard>
    <RelayListBadge readCount={popularity.readCount} writeCount={popularity.writeCount} />
  </SectionCard>
{/if}

<!-- Monitor Data -->
{#if discovery.stats}
  <SectionCard>
    <MonitorDataPanel discoveries={discovery.discoveries} stats={discovery.stats} />
  </SectionCard>
{/if}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 19: Update EventCard for NIP-40 Expiration

Update `apps/web/src/components/EventCard.svelte` to show expiration badges.

**Add import:**
```typescript
import type { ExpirationInfo } from '@relayscope/shared';
import ExpiredBadge from './ExpiredBadge.svelte';
import { parseExpiration } from '../utils/relay';
```

**Add derived state:**
```typescript
const expirationInfo = $derived(parseExpiration(event.tags));
```

**Add badge in the event header (next to kind badge):**
```svelte
<ExpiredBadge expirationInfo={expirationInfo} />
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 20: Add Search Support in Directory

Update `apps/web/src/components/FilterBar.svelte` to add NIP-50 search support.

**Add new prop:**
```typescript
let { filters, onSearch, onNipsChange, onSort, onCountryChange, supportsNip50 = false }: {
  // ...existing props
  supportsNip50?: boolean;
} = $props();
```

**Update search input placeholder:**
```svelte
placeholder={supportsNip50 ? "Search relays (NIP-50)…" : "Search relays…"}
```

After making changes, run:
1. `bun run lint`
2. `bun run type-check`

---

### Prompt 21: Update Feature Doc Status

Edit `docs/features/phase-7-nip-compliance.md` to update the status.

Change the status line from:
```markdown
**Planned** 📋 (2026-06-30)
```
to:
```markdown
**Complete** ✅ (2026-06-30)
```

Also update `docs/roadmap.md` to mark Phase 7 as done:
```
Phase 7  ████████████████████  NIP Compliance & Modernization    ✅ Done
```

After making changes, no verification needed (docs only).

---

## Verification Checklist

After all prompts are complete, run the full verification suite:

```bash
bun run lint
bun run type-check
bun run build
```

Then manual test:
1. Fetch NIP-11 from relay → should display `banner`, `fees` structure if present
2. Connect to monitor relay → should populate discovery data panel
3. View relay with EOSE hints → should show "All events received" or "More events available"
4. View expired event → should show "⚠ Expired" badge
5. View event with future expiration → should show countdown
6. View relay profile → should show popularity badges if listed in relay lists
7. View auth messages → should show color-coded prefixes (OK, CLOSED, auth-required, restricted)
8. Run `bun run build` → should succeed with zero errors

---

*Feature spec: docs/features/phase-7-nip-compliance.md*
