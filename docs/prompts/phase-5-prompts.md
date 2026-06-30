# 🤖 Phase 5: Relay Directory & Comparison — Implementation Prompts

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
- docs/features/phase-5-directory.md — Feature spec
- docs/development/style-guide.md — Code conventions
- docs/architecture/database.md — Schema
- docs/api/endpoints.md — API patterns
- docs/prompts/best-practices.md — Prompt guidelines
```

---

## Implementation Order

Prompts are numbered in build order. Each prompt is atomic — one verifiable change.

---

### Prompt 1: Add Directory Types to Shared Package

Add directory and comparison types to `packages/shared/src/types.ts`.

Add the following types after the existing `WriteTestResult`:

```typescript
// ─── Relay Directory Types ───

export interface DirectoryRelay {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  icon: string | null;
  software: string | null;
  version: string | null;
  supportedNips: number[];
  limitations: RelayLimitation | null;
  country: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheck: {
    httpReachable: boolean;
    corsConfigured: boolean;
    websocketConnectable: boolean;
    latencyMs: number | null;
    checkedAt: Date;
  } | null;
}

export interface DirectoryFilters {
  search?: string;
  nips?: number[];
  authRequired?: boolean;
  paymentRequired?: boolean;
  country?: string;
  sortBy: 'name' | 'url' | 'lastChecked' | 'latency';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface DirectoryResponse {
  relays: DirectoryRelay[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Comparison Types ───

export interface RelayComparison {
  relayA: DirectoryRelay;
  relayB: DirectoryRelay;
  diff: ComparisonDiff;
}

export interface ComparisonDiff {
  nipsOnlyInA: number[];
  nipsOnlyInB: number[];
  sharedNips: number[];
  latencyWinner: 'A' | 'B' | 'tie';
  healthWinner: 'A' | 'B' | 'tie';
}

// ─── Uptime Sparkline Types ───

export interface UptimeDataPoint {
  timestamp: Date;
  isUp: boolean;
  latencyMs: number | null;
}

export interface UptimeSparklineData {
  relayId: string;
  period: '7d' | '30d';
  dataPoints: UptimeDataPoint[];
  uptimePercent: number;
}

// ─── NIP-66 Discovery Types ───

export interface DiscoveryResult {
  relaysFound: number;
  newRelays: number;
  relayUrls: string[];
  discoveredAt: Date;
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 2: Add Directory Query Helpers to API

Create `apps/api/src/routes/directory.ts` with the directory listing endpoint.

```typescript
import type { DirectoryFilters, DirectoryRelay } from '@relayscope/shared';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { healthChecks, relays } from '../db/schema';

const directoryRoutes = new Hono();

// ─── GET /api/directory — List relays with filters ───
directoryRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);

  const filters: DirectoryFilters = {
    search: c.req.query('search') || undefined,
    nips: c.req.query('nips')?.split(',').map(Number).filter(Boolean) || undefined,
    authRequired: c.req.query('authRequired') === 'true' ? true : undefined,
    paymentRequired: c.req.query('paymentRequired') === 'true' ? true : undefined,
    country: c.req.query('country') || undefined,
    sortBy: (c.req.query('sortBy') as DirectoryFilters['sortBy']) || 'name',
    sortOrder: (c.req.query('sortOrder') as DirectoryFilters['sortOrder']) || 'asc',
    page,
    limit,
  };

  const conditions = [];

  // Public relays only
  conditions.push(eq(relays.isPublic, true));

  // Search filter
  if (filters.search) {
    conditions.push(
      sql`(${relays.name} ILIKE ${`%${filters.search}%`} OR ${relays.url} ILIKE ${`%${filters.search}%`})`,
    );
  }

  // Country filter
  if (filters.country) {
    conditions.push(eq(relays.country, filters.country));
  }

  // NIP filter — relay must support ALL specified NIPs
  if (filters.nips && filters.nips.length > 0) {
    for (const nip of filters.nips) {
      conditions.push(sql`${nip} = ANY(${relays.supportedNips})`);
    }
  }

  const whereClause = and(...conditions);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relays)
    .where(whereClause);

  // Build order by
  let orderByClause;
  switch (filters.sortBy) {
    case 'url':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.url) : relays.url;
      break;
    case 'latency':
      orderByClause = filters.sortOrder === 'desc'
        ? desc(healthChecks.latencyMs)
        : healthChecks.latencyMs;
      break;
    case 'lastChecked':
      orderByClause = filters.sortOrder === 'desc'
        ? desc(healthChecks.checkedAt)
        : healthChecks.checkedAt;
      break;
    default:
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.name) : relays.name;
  }

  // Get relays with latest health check
  const results = await db
    .select({
      relay: relays,
      lastHealthCheck: healthChecks,
    })
    .from(relays)
    .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset((page - 1) * limit);

  // Deduplicate health checks (take latest per relay)
  const relayMap = new Map<string, DirectoryRelay>();
  for (const row of results) {
    const existing = relayMap.get(row.relay.id);
    if (!existing) {
      relayMap.set(row.relay.id, {
        ...row.relay,
        lastHealthCheck: row.lastHealthCheck,
      });
    } else if (
      row.lastHealthCheck &&
      (!existing.lastHealthCheck ||
        row.lastHealthCheck.checkedAt > existing.lastHealthCheck.checkedAt)
    ) {
      existing.lastHealthCheck = row.lastHealthCheck;
    }
  }

  return c.json({
    success: true,
    data: {
      relays: Array.from(relayMap.values()),
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// ─── GET /api/directory/countries — List available countries ───
directoryRoutes.get('/countries', async (c) => {
  const countries = await db
    .selectDistinct({ country: relays.country })
    .from(relays)
    .where(sql`${relays.country} IS NOT NULL AND ${relays.isPublic} = true`)
    .orderBy(relays.country);

  return c.json({
    success: true,
    data: countries.map((r) => r.country).filter(Boolean),
  });
});

export default directoryRoutes;
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 3: Mount Directory Routes in API

Edit `apps/api/src/index.ts` to mount the new directory routes.

1. Add import at top:
```typescript
import directoryRoutes from './routes/directory';
```

2. After the relay routes mount, add:
```typescript
// Directory routes
app.route('/api/directory', directoryRoutes);
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

### Prompt 4: Create the `useDirectory` Composable

Create `apps/web/src/lib/composables/useDirectory.svelte.ts`.

This composable fetches relays from the directory API with reactive filters.

```typescript
import type { DirectoryFilters, DirectoryRelay, DirectoryResponse } from '@relayscope/shared';

const API_BASE = '/api/directory';

export function useDirectory() {
  let relays = $state<DirectoryRelay[]>([]);
  let total = $state(0);
  let page = $state(1);
  let totalPages = $state(0);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Filter state
  let filters = $state<DirectoryFilters>({
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  });

  async function fetchRelays(): Promise<void> {
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.nips && filters.nips.length > 0) {
        params.set('nips', filters.nips.join(','));
      }
      if (filters.authRequired) params.set('authRequired', 'true');
      if (filters.paymentRequired) params.set('paymentRequired', 'true');
      if (filters.country) params.set('country', filters.country);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));

      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch directory');
      }

      const data: DirectoryResponse = json.data;
      relays = data.relays;
      total = data.total;
      page = data.page;
      totalPages = data.totalPages;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to fetch directory';
    } finally {
      loading = false;
    }
  }

  function setSearch(search: string) {
    filters = { ...filters, search, page: 1 };
    fetchRelays();
  }

  function setNips(nips: number[]) {
    filters = { ...filters, nips, page: 1 };
    fetchRelays();
  }

  function setCountry(country: string | null) {
    filters = { ...filters, country: country || undefined, page: 1 };
    fetchRelays();
  }

  function setSort(sortBy: DirectoryFilters['sortBy'], sortOrder: DirectoryFilters['sortOrder']) {
    filters = { ...filters, sortBy, sortOrder, page: 1 };
    fetchRelays();
  }

  function setPage(newPage: number) {
    filters = { ...filters, page: newPage };
    fetchRelays();
  }

  function reset() {
    relays = [];
    total = 0;
    page = 1;
    totalPages = 0;
    loading = false;
    error = null;
    filters = { sortBy: 'name', sortOrder: 'asc', page: 1, limit: 20 };
  }

  return {
    get relays() { return relays; },
    get total() { return total; },
    get page() { return page; },
    get totalPages() { return totalPages; },
    get loading() { return loading; },
    get error() { return error; },
    get filters() { return filters; },
    fetchRelays,
    setSearch,
    setNips,
    setCountry,
    setSort,
    setPage,
    reset,
  };
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 5: Create the `RelayCard` Component

Create `apps/web/src/components/RelayCard.svelte`.

A card displaying a single relay in the directory listing.

```svelte
<script lang="ts">
import type { DirectoryRelay } from '@relayscope/shared';
import SectionCard from './SectionCard.svelte';

let { relay, onSelect, selected }: {
  relay: DirectoryRelay;
  onSelect: (id: string) => void;
  selected: boolean;
} = $props();

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

const isOnline = $derived(
  relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable,
);

const latencyDisplay = $derived(
  relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—',
);

const nipCount = $derived(relay.supportedNips.length);
</script>

<button
  type="button"
  onclick={() => onSelect(relay.id)}
  class="w-full text-left transition-all {selected
    ? 'ring-2 ring-accent border-accent-border'
    : 'hover:border-accent-border/50'}"
>
  <SectionCard className="cursor-pointer">
    <div class="flex items-start gap-3">
      {#if relay.icon}
        <img
          src={relay.icon}
          alt=""
          class="w-10 h-10 rounded-lg border border-dark-border object-cover shrink-0"
          onerror={handleImageError}
        />
      {:else}
        <div
          class="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center shrink-0"
        >
          <span class="text-text-muted text-sm">⚡</span>
        </div>
      {/if}

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold text-text-primary truncate">
            {relay.name || 'Unknown Relay'}
          </h3>
          {#if isOnline}
            <span class="w-2 h-2 rounded-full bg-success shrink-0"></span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-error shrink-0"></span>
          {/if}
        </div>

        <p class="text-xs text-text-muted font-mono truncate mb-2">{relay.url}</p>

        {#if relay.description}
          <p class="text-xs text-text-secondary line-clamp-2 mb-2">{relay.description}</p>
        {/if}

        <div class="flex items-center gap-3 text-[10px] text-text-muted">
          <span>{nipCount} NIPs</span>
          <span>·</span>
          <span>{latencyDisplay}</span>
          {#if relay.software}
            <span>·</span>
            <span>{relay.software}</span>
          {/if}
        </div>
      </div>

      <div class="shrink-0">
        <input
          type="checkbox"
          checked={selected}
          class="w-4 h-4 rounded border-dark-border text-accent focus:ring-accent-border"
          onclick|stopPropagation={() => onSelect(relay.id)}
        />
      </div>
    </div>
  </SectionCard>
</button>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 6: Create the `FilterBar` Component

Create `apps/web/src/components/FilterBar.svelte`.

A horizontal filter bar with search, NIP filter, and sort controls.

```svelte
<script lang="ts">
import type { DirectoryFilters } from '@relayscope/shared';

let { filters, onSearch, onNipsChange, onSort, onCountryChange }: {
  filters: DirectoryFilters;
  onSearch: (search: string) => void;
  onNipsChange: (nips: number[]) => void;
  onSort: (sortBy: DirectoryFilters['sortBy'], sortOrder: DirectoryFilters['sortOrder']) => void;
  onCountryChange: (country: string | null) => void;
} = $props();

let searchInput = $state(filters.search || '');
let nipInput = $state(filters.nips?.join(', ') || '');
let countryInput = $state(filters.country || '');

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    onSearch(searchInput);
  }, 300);
}

function handleNipBlur() {
  const nips = nipInput
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  onNipsChange(nips);
}

function handleCountryChange() {
  onCountryChange(countryInput || null);
}
</script>

<div class="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-dark-card border border-dark-border">
  <!-- Search -->
  <div class="relative flex-1 min-w-[200px]">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
      <svg
        aria-hidden="true"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <input
      type="text"
      bind:value={searchInput}
      oninput={handleSearchInput}
      placeholder="Search relays…"
      class="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
  </div>

  <!-- NIP Filter -->
  <div class="relative">
    <input
      type="text"
      bind:value={nipInput}
      onblur={handleNipBlur}
      placeholder="NIPs (e.g. 42, 11)"
      class="w-36 px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
    />
  </div>

  <!-- Country Filter -->
  <div class="relative">
    <input
      type="text"
      bind:value={countryInput}
      onblur={handleCountryChange}
      placeholder="Country (e.g. US)"
      class="w-28 px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
    />
  </div>

  <!-- Sort -->
  <select
    bind:value={filters.sortBy}
    onchange={() => onSort(filters.sortBy, filters.sortOrder)}
    class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-all"
  >
    <option value="name">Name</option>
    <option value="url">URL</option>
    <option value="lastChecked">Last Checked</option>
    <option value="latency">Latency</option>
  </select>

  <button
    type="button"
    onclick={() => onSort(filters.sortBy, filters.sortOrder === 'asc' ? 'desc' : 'asc')}
    class="p-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
    title="Toggle sort order"
  >
    {filters.sortOrder === 'asc' ? '↑' : '↓'}
  </button>
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 7: Create the `RelayDirectory` Component

Create `apps/web/src/components/RelayDirectory.svelte`.

The main directory page component that composes FilterBar and RelayCard.

```svelte
<script lang="ts">
import { useDirectory } from '../lib/composables/useDirectory.svelte';
import FilterBar from './FilterBar.svelte';
import LoadingSpinner from './LoadingSpinner.svelte';
import RelayCard from './RelayCard.svelte';
import SectionCard from './SectionCard.svelte';

let { onSelectRelay }: { onSelectRelay: (url: string) => void } = $props();

const directory = useDirectory();
let selectedIds = $state<Set<string>>(new Set());

// Load initial relays
$effect(() => {
  directory.fetchRelays();
});

function handleSelect(id: string) {
  const newSet = new Set(selectedIds);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    if (newSet.size >= 2) {
      // Replace oldest selection
      const first = newSet.values().next().value;
      if (first) newSet.delete(first);
    }
    newSet.add(id);
  }
  selectedIds = newSet;
}

function handleInspect(url: string) {
  onSelectRelay(url);
}
</script>

<div class="space-y-4">
  <!-- Filter Bar -->
  <FilterBar
    filters={directory.filters}
    onSearch={(s) => directory.setSearch(s)}
    onNipsChange={(n) => directory.setNips(n)}
    onSort={(by, order) => directory.setSort(by, order)}
    onCountryChange={(c) => directory.setCountry(c)}
  />

  <!-- Selection Actions -->
  {#if selectedIds.size === 2}
    <div
      class="flex items-center justify-between px-4 py-3 rounded-xl bg-accent-dim border border-accent-border"
    >
      <span class="text-xs text-accent">
        {selectedIds.size} relays selected — ready to compare
      </span>
      <button
        type="button"
        class="text-xs px-3 py-1 rounded-lg bg-accent text-white hover:opacity-90 transition-all"
      >
        Compare →
      </button>
    </div>
  {/if}

  <!-- Loading -->
  {#if directory.loading}
    <LoadingSpinner />
  {/if}

  <!-- Error -->
  {#if directory.error}
    <SectionCard>
      <div class="text-center py-6">
        <p class="text-sm text-error mb-2">Failed to load directory</p>
        <p class="text-xs text-text-muted">{directory.error}</p>
        <button
          type="button"
          onclick={() => directory.fetchRelays()}
          class="mt-3 text-xs px-3 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
        >
          Retry
        </button>
      </div>
    </SectionCard>
  {/if}

  <!-- Relay List -->
  {#if !directory.loading && !directory.error}
    <div class="space-y-2">
      {#each directory.relays as relay (relay.id)}
        <RelayCard
          {relay}
          onSelect={handleSelect}
          selected={selectedIds.has(relay.id)}
        />
      {/each}
    </div>

    {#if directory.relays.length === 0}
      <SectionCard>
        <div class="text-center py-8">
          <p class="text-sm text-text-muted">No relays found matching your filters.</p>
        </div>
      </SectionCard>
    {/if}
  {/if}

  <!-- Pagination -->
  {#if directory.totalPages > 1}
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        onclick={() => directory.setPage(directory.page - 1)}
        disabled={directory.page <= 1}
        class="px-3 py-1.5 rounded-lg text-xs bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary disabled:opacity-40 transition-all"
      >
        ← Prev
      </button>
      <span class="text-xs text-text-muted">
        Page {directory.page} of {directory.totalPages}
      </span>
      <button
        type="button"
        onclick={() => directory.setPage(directory.page + 1)}
        disabled={directory.page >= directory.totalPages}
        class="px-3 py-1.5 rounded-lg text-xs bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary disabled:opacity-40 transition-all"
      >
        Next →
      </button>
    </div>
  {/if}

  <!-- Total Count -->
  {#if directory.total > 0}
    <p class="text-center text-[10px] text-text-muted">
      {directory.total.toLocaleString()} relays in directory
    </p>
  {/if}
</div>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 8: Add Comparison API Endpoint

Add a comparison endpoint to `apps/api/src/routes/directory.ts`.

Add the following after the `/countries` endpoint:

```typescript
// ─── GET /api/directory/compare/:id1/:id2 — Compare two relays ───
directoryRoutes.get('/compare/:id1/:id2', async (c) => {
  const id1 = c.req.param('id1');
  const id2 = c.req.param('id2');

  const [result1, result2] = await Promise.all([
    db
      .select({ relay: relays, hc: healthChecks })
      .from(relays)
      .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
      .where(eq(relays.id, id1))
      .limit(1),
    db
      .select({ relay: relays, hc: healthChecks })
      .from(relays)
      .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
      .where(eq(relays.id, id2))
      .limit(1),
  ]);

  if (result1.length === 0 || result2.length === 0) {
    return c.json({ success: false, error: 'One or both relays not found' }, 404);
  }

  const relayA = result1[0].relay;
  const relayB = result2[0].relay;
  const hcA = result1[0].hc;
  const hcB = result2[0].hc;

  const nipsA = new Set(relayA.supportedNips || []);
  const nipsB = new Set(relayB.supportedNips || []);

  const nipsOnlyInA = [...nipsA].filter((n) => !nipsB.has(n));
  const nipsOnlyInB = [...nipsB].filter((n) => !nipsA.has(n));
  const sharedNips = [...nipsA].filter((n) => nipsB.has(n));

  // Latency comparison
  let latencyWinner: 'A' | 'B' | 'tie' = 'tie';
  if (hcA?.latencyMs != null && hcB?.latencyMs != null) {
    if (hcA.latencyMs < hcB.latencyMs) latencyWinner = 'A';
    else if (hcB.latencyMs < hcA.latencyMs) latencyWinner = 'B';
  } else if (hcA?.latencyMs != null) {
    latencyWinner = 'A';
  } else if (hcB?.latencyMs != null) {
    latencyWinner = 'B';
  }

  // Health comparison
  let healthWinner: 'A' | 'B' | 'tie' = 'tie';
  const scoreA = (hcA?.httpReachable ? 1 : 0) + (hcA?.websocketConnectable ? 1 : 0);
  const scoreB = (hcB?.httpReachable ? 1 : 0) + (hcB?.websocketConnectable ? 1 : 0);
  if (scoreA > scoreB) healthWinner = 'A';
  else if (scoreB > scoreA) healthWinner = 'B';

  return c.json({
    success: true,
    data: {
      relayA: { ...relayA, lastHealthCheck: hcA },
      relayB: { ...relayB, lastHealthCheck: hcB },
      diff: {
        nipsOnlyInA,
        nipsOnlyInB,
        sharedNips,
        latencyWinner,
        healthWinner,
      },
    },
  });
});
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

### Prompt 9: Create the `ComparisonView` Component

Create `apps/web/src/components/ComparisonView.svelte`.

Side-by-side comparison of two relays.

```svelte
<script lang="ts">
import type { DirectoryRelay } from '@relayscope/shared';
import SectionCard from './SectionCard.svelte';

let { relayA, relayB, diff, onClose }: {
  relayA: DirectoryRelay;
  relayB: DirectoryRelay;
  diff: {
    nipsOnlyInA: number[];
    nipsOnlyInB: number[];
    sharedNips: number[];
    latencyWinner: 'A' | 'B' | 'tie';
    healthWinner: 'A' | 'B' | 'tie';
  };
  onClose: () => void;
} = $props();

function winnerClass(winner: 'A' | 'B' | 'tie', side: 'A' | 'B'): string {
  if (winner === 'tie') return '';
  if (winner === side) return 'text-success';
  return 'text-error';
}

function latencyDisplay(relay: DirectoryRelay): string {
  return relay.lastHealthCheck?.latencyMs != null
    ? `${relay.lastHealthCheck.latencyMs}ms`
    : '—';
}

function healthStatus(relay: DirectoryRelay): string {
  if (relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable) {
    return 'Online';
  }
  return 'Offline';
}
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-text-primary">Relay Comparison</h3>
    <button
      type="button"
      onclick={onClose}
      class="text-xs px-3 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
    >
      ✕ Close
    </button>
  </div>

  <!-- Relay Headers -->
  <div class="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayA.name || 'Unknown'}</h4>
      <p class="text-[10px] text-text-muted font-mono truncate">{relayA.url}</p>
    </div>
    <div class="text-text-muted text-xs self-center">vs</div>
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayB.name || 'Unknown'}</h4>
      <p class="text-[10px] text-text-muted font-mono truncate">{relayB.url}</p>
    </div>
  </div>

  <!-- Comparison Rows -->
  <div class="space-y-2">
    <!-- Health -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center {winnerClass(diff.healthWinner, 'A')}">
        {healthStatus(relayA)}
      </span>
      <span class="text-[10px] text-text-muted self-center">Health</span>
      <span class="text-xs text-center {winnerClass(diff.healthWinner, 'B')}">
        {healthStatus(relayB)}
      </span>
    </div>

    <!-- Latency -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'A')}">
        {latencyDisplay(relayA)}
      </span>
      <span class="text-[10px] text-text-muted self-center">Latency</span>
      <span class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'B')}">
        {latencyDisplay(relayB)}
      </span>
    </div>

    <!-- NIP Count -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center font-mono text-text-primary">
        {relayA.supportedNips.length}
      </span>
      <span class="text-[10px] text-text-muted self-center">NIPs</span>
      <span class="text-xs text-center font-mono text-text-primary">
        {relayB.supportedNips.length}
      </span>
    </div>

    <!-- Shared NIPs -->
    <div class="py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted text-center mb-1">Shared NIPs</p>
      <p class="text-xs text-text-secondary text-center font-mono">
        {diff.sharedNips.length > 0 ? diff.sharedNips.join(', ') : 'None'}
      </p>
    </div>

    <!-- NIPs only in A -->
    {#if diff.nipsOnlyInA.length > 0}
      <div class="py-2 px-3 rounded-lg bg-success-dim border border-success/20">
        <p class="text-[10px] text-success text-center mb-1">Only in {relayA.name || 'A'}</p>
        <p class="text-xs text-success font-mono text-center">
          {diff.nipsOnlyInA.join(', ')}
        </p>
      </div>
    {/if}

    <!-- NIPs only in B -->
    {#if diff.nipsOnlyInB.length > 0}
      <div class="py-2 px-3 rounded-lg bg-success-dim border border-success/20">
        <p class="text-[10px] text-success text-center mb-1">Only in {relayB.name || 'B'}</p>
        <p class="text-xs text-success font-mono text-center">
          {diff.nipsOnlyInB.join(', ')}
        </p>
      </div>
    {/if}
  </div>
</SectionCard>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 10: Create the `usePermalink` Composable

Create `apps/web/src/lib/composables/usePermalink.svelte.ts`.

Manages URL-based deep linking for relay profiles and comparisons.

```typescript
export function usePermalink() {
  let currentRelayUrl = $state<string | null>(null);
  let compareIds = $state<[string, string] | null>(null);

  /**
   * Parse the current URL path for relay or compare routes.
   * Call once on mount.
   */
  function parseUrl(): { type: 'relay' | 'compare' | null; param?: string } {
    const path = window.location.pathname;

    // /relay/relay.damus.io
    const relayMatch = path.match(/^\/relay\/(.+)$/);
    if (relayMatch) {
      const url = `wss://${decodeURIComponent(relayMatch[1])}`;
      currentRelayUrl = url;
      return { type: 'relay', param: url };
    }

    // /compare/:id1/:id2
    const compareMatch = path.match(/^\/compare\/([^/]+)\/([^/]+)$/);
    if (compareMatch) {
      compareIds = [compareMatch[1], compareMatch[2]];
      return { type: 'compare', param: `${compareMatch[1]}/${compareMatch[2]}` };
    }

    return { type: null };
  }

  /**
   * Update the URL without triggering a page reload.
   */
  function pushRelay(url: string) {
    const slug = url.replace('wss://', '').replace('ws://', '');
    window.history.pushState({}, '', `/relay/${slug}`);
    currentRelayUrl = url;
  }

  function pushCompare(id1: string, id2: string) {
    window.history.pushState({}, '', `/compare/${id1}/${id2}`);
    compareIds = [id1, id2];
  }

  function clear() {
    window.history.pushState({}, '', '/');
    currentRelayUrl = null;
    compareIds = null;
  }

  function copyShareLink(): string | null {
    if (currentRelayUrl) {
      const slug = currentRelayUrl.replace('wss://', '').replace('ws://', '');
      const link = `${window.location.origin}/relay/${slug}`;
      navigator.clipboard.writeText(link);
      return link;
    }
    if (compareIds) {
      const link = `${window.location.origin}/compare/${compareIds[0]}/${compareIds[1]}`;
      navigator.clipboard.writeText(link);
      return link;
    }
    return null;
  }

  return {
    get currentRelayUrl() { return currentRelayUrl; },
    get compareIds() { return compareIds; },
    parseUrl,
    pushRelay,
    pushCompare,
    clear,
    copyShareLink,
  };
}
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`

---

### Prompt 11: Wire Directory into `App.svelte`

Edit `apps/web/src/App.svelte` to add a Directory tab with the RelayDirectory component.

**Changes:**

1. Add imports at top:
```typescript
import RelayDirectory from './components/RelayDirectory.svelte';
```

2. Add a new tab type:
```typescript
type Tab = 'nip11' | 'stream' | 'verifier' | 'directory';
```

3. Add derived state:
```typescript
const isDirectoryTab = $derived(activeTab === 'directory');
```

4. Add a new tab button after the Verifier tab:
```svelte
<button
  type="button"
  onclick={() => (activeTab = 'directory')}
  class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {isDirectoryTab
    ? 'bg-dark-card border border-dark-border text-text-primary'
    : 'text-text-muted hover:text-text-secondary'}"
>
  📂 Directory
</button>
```

5. Add the directory tab content after the Event Verifier tab:
```svelte
<!-- Directory Tab -->
{#if isDirectoryTab}
  <RelayDirectory
    onSelectRelay={(relayUrl) => {
      url = relayUrl;
      activeTab = 'nip11';
      handleFetch(relayUrl);
    }}
  />
{/if}
```

6. Update the Phase badge to `"Phase 5"`.

7. Update the empty state feature pills to include the new Phase 5 feature:
```svelte
<span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
  Relay Directory
</span>
```

After making changes, run:
1. `bunx biome check .`
2. `bunx turbo type-check`
3. `bunx turbo build`

---

### Prompt 12: Update Feature Doc Status

Edit `docs/features/phase-5-directory.md` to update the status.

Change the status line from:
```markdown
**Planned** 📋
```
to:
```markdown
**Complete** ✅ (2026-06-30)
```

After making changes, no verification needed (docs only).

---

## Verification Checklist

After all prompts are complete, run the full verification suite:

```bash
bunx biome check .
bunx turbo type-check
bunx turbo build
```

Then manual test:
1. Click the **📂 Directory** tab → should load relay list from API
2. Type in the search box → should filter relays by name/URL
3. Enter "42" in the NIP filter → should show only relays supporting NIP-42
4. Click two relay cards → should show "Compare" button
5. Click **Compare** → should show side-by-side comparison with differences highlighted
6. Change sort dropdown → should re-order the list
7. Click pagination → should load next page
8. Navigate to `/relay/relay.damus.io` → should deep-link to the relay
9. Run `bunx turbo build` → should succeed with zero errors

---

*Feature spec: docs/features/phase-5-directory.md*
