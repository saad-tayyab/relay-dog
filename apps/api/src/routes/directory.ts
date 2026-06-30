import type { DirectoryFilters, DirectoryRelay, RelayLimitation } from '@relayscope/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { healthChecks, relays } from '../db/schema';

const directoryRoutes = new Hono();

// ─── Helper: map DB relay row to DirectoryRelay ───
function toDirectoryRelay(
  row: typeof relays.$inferSelect,
  hc: typeof healthChecks.$inferSelect | null,
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
    lastHealthCheck: hc
      ? {
          httpReachable: hc.httpReachable,
          corsConfigured: hc.corsConfigured,
          websocketConnectable: hc.websocketConnectable,
          latencyMs: hc.latencyMs,
          checkedAt: hc.checkedAt,
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
  let orderByClause:
    | ReturnType<typeof desc>
    | typeof relays.name
    | typeof relays.url
    | typeof healthChecks.latencyMs
    | typeof healthChecks.checkedAt;
  switch (filters.sortBy) {
    case 'url':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.url) : relays.url;
      break;
    case 'latency':
      orderByClause =
        filters.sortOrder === 'desc' ? desc(healthChecks.latencyMs) : healthChecks.latencyMs;
      break;
    case 'lastChecked':
      orderByClause =
        filters.sortOrder === 'desc' ? desc(healthChecks.checkedAt) : healthChecks.checkedAt;
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
      relayMap.set(row.relay.id, toDirectoryRelay(row.relay, row.lastHealthCheck));
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

  const relayA = toDirectoryRelay(result1[0].relay, result1[0].hc);
  const relayB = toDirectoryRelay(result2[0].relay, result2[0].hc);

  const nipsA = new Set(relayA.supportedNips || []);
  const nipsB = new Set(relayB.supportedNips || []);

  const nipsOnlyInA = [...nipsA].filter((n) => !nipsB.has(n));
  const nipsOnlyInB = [...nipsB].filter((n) => !nipsA.has(n));
  const sharedNips = [...nipsA].filter((n) => nipsB.has(n));

  // Latency comparison
  let latencyWinner: 'A' | 'B' | 'tie' = 'tie';
  const latA = relayA.lastHealthCheck?.latencyMs;
  const latB = relayB.lastHealthCheck?.latencyMs;
  if (latA != null && latB != null) {
    if (latA < latB) latencyWinner = 'A';
    else if (latB < latA) latencyWinner = 'B';
  } else if (latA != null) {
    latencyWinner = 'A';
  } else if (latB != null) {
    latencyWinner = 'B';
  }

  // Health comparison
  let healthWinner: 'A' | 'B' | 'tie' = 'tie';
  const scoreA =
    (relayA.lastHealthCheck?.httpReachable ? 1 : 0) +
    (relayA.lastHealthCheck?.websocketConnectable ? 1 : 0);
  const scoreB =
    (relayB.lastHealthCheck?.httpReachable ? 1 : 0) +
    (relayB.lastHealthCheck?.websocketConnectable ? 1 : 0);
  if (scoreA > scoreB) healthWinner = 'A';
  else if (scoreB > scoreA) healthWinner = 'B';

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
