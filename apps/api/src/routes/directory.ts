import type { DirectoryFilters } from '@relayscope/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { getLatestDiscovery, getRelayById } from '../db/queries';
import { relayDiscovered, relays } from '../db/schema';
import {
  latencyWinner as computeLatencyWinner,
  nipDiff,
  sortByLatency,
  toDirectoryRelay,
} from '../lib/relay-helpers';
import { parsePageLimit } from '../lib/utils';

const directoryRoutes = new Hono();

// ─── GET /api/directory — List relays with filters ───
directoryRoutes.get('/', async (c) => {
  const { page, limit } = parsePageLimit(c.req.query('page'), c.req.query('limit'));

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
  conditions.push(eq(relays.isPublic, true));

  if (filters.search) {
    conditions.push(
      sql`(${relays.name} ILIKE ${`%${filters.search}%`} OR ${relays.url} ILIKE ${`%${filters.search}%`})`,
    );
  }
  if (filters.country) {
    conditions.push(eq(relays.country, filters.country));
  }
  if (filters.nips && filters.nips.length > 0) {
    for (const nip of filters.nips) {
      conditions.push(sql`${nip} = ANY(${relays.supportedNips})`);
    }
  }

  const whereClause = and(...conditions);
  const isLatencySort = filters.sortBy === 'latency';

  let orderByClause:
    | ReturnType<typeof desc>
    | typeof relays.name
    | typeof relays.url
    | typeof relays.updatedAt;
  switch (filters.sortBy) {
    case 'url':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.url) : relays.url;
      break;
    case 'lastChecked':
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.updatedAt) : relays.updatedAt;
      break;
    default:
      orderByClause = filters.sortOrder === 'desc' ? desc(relays.name) : relays.name;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relays)
    .where(whereClause);

  const fetchedRelays = isLatencySort
    ? await db.select().from(relays).where(whereClause)
    : await db
        .select()
        .from(relays)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset((page - 1) * limit);

  if (fetchedRelays.length === 0) {
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

  const relayUrls = fetchedRelays.map((r) => r.url);
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

  const sortedRelays = isLatencySort
    ? sortByLatency(fetchedRelays, discoveryMap, filters.sortOrder)
    : fetchedRelays;

  const paginatedRelays = isLatencySort
    ? sortedRelays.slice((page - 1) * limit, page * limit)
    : sortedRelays;

  const resultRelays = paginatedRelays.map((relay) =>
    toDirectoryRelay(relay, discoveryMap.get(relay.url) ?? null),
  );

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

  const [[relay1], [relay2]] = await Promise.all([
    getRelayById.execute({ id: id1 }),
    getRelayById.execute({ id: id2 }),
  ]);

  if (!relay1 || !relay2) {
    return c.json({ success: false, error: 'One or both relays not found' }, 404);
  }

  const [disc1, disc2] = await Promise.all([
    getLatestDiscovery.execute({ relayUrl: relay1.url }),
    getLatestDiscovery.execute({ relayUrl: relay2.url }),
  ]);

  const relayA = toDirectoryRelay(relay1, disc1[0] ?? null);
  const relayB = toDirectoryRelay(relay2, disc2[0] ?? null);

  return c.json({
    success: true,
    data: {
      relayA,
      relayB,
      diff: {
        ...nipDiff(relayA.supportedNips || [], relayB.supportedNips || []),
        latencyWinner: computeLatencyWinner(disc1[0], disc2[0]),
      },
    },
  });
});

export default directoryRoutes;
