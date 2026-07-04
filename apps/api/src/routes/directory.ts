import type { DirectoryFilters, DirectoryRelay, RelayLimitation } from '@relayscope/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayDiscovered, relays } from '../db/schema';

const directoryRoutes = new Hono();

// ─── Helper: map DB relay row to DirectoryRelay ───
function toDirectoryRelay(
  row: typeof relays.$inferSelect,
  discovery: typeof relayDiscovered.$inferSelect | null,
): DirectoryRelay {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    description: row.description,
    icon: row.icon,
    software: row.software,
    version: row.version,
    supportedNips: row.supportedNips ?? [],
    limitations: (row.limitations as RelayLimitation | null) ?? null,
    country: row.country,
    isPublic: row.isPublic ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

// ─── GET /api/directory — List relays with filters ───
directoryRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);

  const filters: DirectoryFilters = {
    search: c.req.query('search') || undefined,
    nips:
      c.req
        .query('nips')
        ?.split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0) || undefined,
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

  // Build order by (for the relay query only)
  let orderByClause:
    | ReturnType<typeof desc>
    | typeof relays.name
    | typeof relays.url
    | typeof relays.updatedAt;
  switch (filters.sortBy) {
    case 'url':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.url) : relays.url;
      break;
    case 'latency':
      // For latency sort, fall back to name since we fetch discoveries separately
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.name) : relays.name;
      break;
    case 'lastChecked':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.updatedAt) : relays.updatedAt;
      break;
    default:
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.name) : relays.name;
  }

  // Step 1: Get total count of unique relays
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relays)
    .where(whereClause);

  // Step 2: Get paginated relays
  const paginatedRelays = await db
    .select()
    .from(relays)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset((page - 1) * limit);

  if (paginatedRelays.length === 0) {
    return c.json({
      success: true,
      data: {
        relays: [],
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    });
  }

  // Step 3: Fetch latest NIP-66 discovery for each relay
  const relayUrls = paginatedRelays.map((r) => r.url);
  const allDiscoveries = await db
    .select()
    .from(relayDiscovered)
    .where(inArray(relayDiscovered.relayUrl, relayUrls))
    .orderBy(desc(relayDiscovered.discoveredAt));

  // Build lookup: relayUrl → latest discovery
  const discoveryMap = new Map<string, typeof relayDiscovered.$inferSelect>();
  for (const d of allDiscoveries) {
    if (!discoveryMap.has(d.relayUrl)) {
      discoveryMap.set(d.relayUrl, d);
    }
  }

  // Step 4: Assemble final results
  let resultRelays: DirectoryRelay[];

  if (filters.sortBy === 'latency') {
    // Sort by rtt_open from latest discovery (nulls last)
    const sorted = [...paginatedRelays].sort((a, b) => {
      const dA = discoveryMap.get(a.url);
      const dB = discoveryMap.get(b.url);
      const rttA = dA?.rttOpen ?? Number.MAX_SAFE_INTEGER;
      const rttB = dB?.rttOpen ?? Number.MAX_SAFE_INTEGER;
      return filters.sortOrder === 'desc' ? rttB - rttA : rttA - rttB;
    });
    resultRelays = sorted.map((r) => toDirectoryRelay(r, discoveryMap.get(r.url) ?? null));
  } else {
    resultRelays = paginatedRelays.map((relay) =>
      toDirectoryRelay(relay, discoveryMap.get(relay.url) ?? null),
    );
  }

  return c.json({
    success: true,
    data: {
      relays: resultRelays,
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

// ─── GET /api/directory/compare/:id1/:id2 — Compare two relays ───
directoryRoutes.get('/compare/:id1/:id2', async (c) => {
  const id1 = c.req.param('id1');
  const id2 = c.req.param('id2');

  const [relay1, relay2] = await Promise.all([
    db.select().from(relays).where(eq(relays.id, id1)).limit(1),
    db.select().from(relays).where(eq(relays.id, id2)).limit(1),
  ]);

  if (relay1.length === 0 || relay2.length === 0) {
    return c.json({ success: false, error: 'One or both relays not found' }, 404);
  }

  // Fetch latest discovery for each
  const [disc1, disc2] = await Promise.all([
    db
      .select()
      .from(relayDiscovered)
      .where(eq(relayDiscovered.relayUrl, relay1[0].url))
      .orderBy(desc(relayDiscovered.discoveredAt))
      .limit(1),
    db
      .select()
      .from(relayDiscovered)
      .where(eq(relayDiscovered.relayUrl, relay2[0].url))
      .orderBy(desc(relayDiscovered.discoveredAt))
      .limit(1),
  ]);

  const relayA = toDirectoryRelay(relay1[0], disc1[0] ?? null);
  const relayB = toDirectoryRelay(relay2[0], disc2[0] ?? null);

  const nipsA = new Set(relayA.supportedNips || []);
  const nipsB = new Set(relayB.supportedNips || []);

  const nipsOnlyInA = [...nipsA].filter((n) => !nipsB.has(n));
  const nipsOnlyInB = [...nipsB].filter((n) => !nipsA.has(n));
  const sharedNips = [...nipsA].filter((n) => nipsB.has(n));

  // Latency comparison
  let latencyWinner: 'A' | 'B' | 'tie' = 'tie';
  const latA = relayA.lastDiscovery?.rttOpen;
  const latB = relayB.lastDiscovery?.rttOpen;
  if (latA != null && latB != null) {
    if (latA < latB) latencyWinner = 'A';
    else if (latB < latA) latencyWinner = 'B';
  } else if (latA != null) {
    latencyWinner = 'A';
  } else if (latB != null) {
    latencyWinner = 'B';
  }

  // Health comparison — "online" if discovered within last 24h
  let healthWinner: 'A' | 'B' | 'tie' = 'tie';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isOnlineA =
    relayA.lastDiscovery != null &&
    now - new Date(relayA.lastDiscovery.discoveredAt).getTime() < dayMs;
  const isOnlineB =
    relayB.lastDiscovery != null &&
    now - new Date(relayB.lastDiscovery.discoveredAt).getTime() < dayMs;
  if (isOnlineA && !isOnlineB) healthWinner = 'A';
  else if (isOnlineB && !isOnlineA) healthWinner = 'B';

  return c.json({
    success: true,
    data: {
      relayA,
      relayB,
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

export default directoryRoutes;
