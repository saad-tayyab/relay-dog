import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { healthChecks, relayInfoSnapshots, relays } from '../db/schema';
import { categorizeError } from '../lib/errors';
import { createRelaySchema, updateRelaySchema } from '../lib/schemas';
import { assertSafeUrl } from '../lib/ssrf';
import { requireApiKey } from '../middleware/auth';

const relayRoutes = new Hono();

const MAX_PAGE_LIMIT = 100;

function parsePageLimit(rawPage: string | undefined, rawLimit: string | undefined) {
  const page = Math.max(1, parseInt(rawPage || '1', 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(rawLimit || '20', 10) || 20), MAX_PAGE_LIMIT);
  return { page, limit };
}

function normalizeRelayUrl(raw: string): string {
  let url = raw.trim();
  if (
    !url.startsWith('wss://') &&
    !url.startsWith('ws://') &&
    !url.startsWith('https://') &&
    !url.startsWith('http://')
  ) {
    url = `wss://${url}`;
  }
  assertSafeUrl(url);
  return url;
}

function toHttpUrl(url: string): string {
  const httpUrl = url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
  assertSafeUrl(httpUrl);
  return httpUrl;
}

function toWsUrl(url: string): string {
  const wsUrl = url.startsWith('http')
    ? url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    : url;
  assertSafeUrl(wsUrl);
  return wsUrl;
}

// ─── GET /api/relays — List all relays with optional filters ───
relayRoutes.get('/', async (c) => {
  const { page, limit } = parsePageLimit(c.req.query('page'), c.req.query('limit'));

  const query = {
    search: c.req.query('search') || undefined,
    nips:
      c.req
        .query('nips')
        ?.split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n)) || undefined,
    authRequired: c.req.query('authRequired') === 'true' ? true : undefined,
    paymentRequired: c.req.query('paymentRequired') === 'true' ? true : undefined,
    isOnline: c.req.query('isOnline') === 'true' ? true : undefined,
    country: c.req.query('country') || undefined,
    page,
    limit,
    sortBy: (c.req.query('sortBy') as 'name' | 'url' | 'lastChecked' | 'latency') || 'name',
    sortOrder: (c.req.query('sortOrder') as 'asc' | 'desc') || 'asc',
  };

  const offset = (page - 1) * limit;
  const conditions = [];

  if (query.search) {
    conditions.push(
      sql`(${relays.name} ILIKE ${`%${query.search}%`} OR ${relays.url} ILIKE ${`%${query.search}%`})`,
    );
  }
  if (query.country) {
    conditions.push(eq(relays.country, query.country));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relays)
    .where(whereClause);

  const results = await db
    .select({
      relay: relays,
      lastHealthCheck: healthChecks,
    })
    .from(relays)
    .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
    .where(whereClause)
    .orderBy(desc(relays.updatedAt))
    .limit(limit)
    .offset(offset);

  const relayMap = new Map();
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
    data: Array.from(relayMap.values()),
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// ─── GET /api/relays/:id — Get single relay ───
relayRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [result] = await db
    .select({
      relay: relays,
      lastHealthCheck: healthChecks,
    })
    .from(relays)
    .leftJoin(healthChecks, eq(relays.id, healthChecks.relayId))
    .where(eq(relays.id, id))
    .limit(1);

  if (!result) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const [latestInfo] = await db
    .select()
    .from(relayInfoSnapshots)
    .where(eq(relayInfoSnapshots.relayId, id))
    .orderBy(desc(relayInfoSnapshots.fetchedAt))
    .limit(1);

  return c.json({
    success: true,
    data: {
      ...result.relay,
      lastHealthCheck: result.lastHealthCheck,
      latestInfo: latestInfo || null,
    },
  });
});

// ─── POST /api/relays — Add a new relay ───
relayRoutes.post('/', requireApiKey, zValidator('json', createRelaySchema), async (c) => {
  const body = c.req.valid('json');

  let url: string;
  try {
    url = normalizeRelayUrl(body.url);
  } catch {
    return c.json({ success: false, error: 'Invalid or disallowed relay URL' }, 400);
  }

  const [existing] = await db.select().from(relays).where(eq(relays.url, url)).limit(1);
  if (existing) {
    return c.json({ success: false, error: 'Relay already exists', data: existing }, 409);
  }

  let nip11Data: Record<string, unknown> = {};
  try {
    const httpUrl = toHttpUrl(url);
    const res = await fetch(httpUrl, {
      headers: { Accept: 'application/nostr+json' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      nip11Data = await res.json();
    }
  } catch {
    // NIP-11 fetch failed — relay might be down, still add it
  }

  const [newRelay] = await db
    .insert(relays)
    .values({
      url,
      name: (nip11Data.name as string) || body.name || null,
      description: (nip11Data.description as string) || null,
      icon: (nip11Data.icon as string) || null,
      software: (nip11Data.software as string) || null,
      version: (nip11Data.version as string) || null,
      supportedNips: (nip11Data.supported_nips as number[]) || [],
      limitations: (nip11Data.limitation as Record<string, unknown>) || null,
      isPublic: body.isPublic ?? true,
    })
    .returning();

  if (Object.keys(nip11Data).length > 0) {
    await db.insert(relayInfoSnapshots).values({
      relayId: newRelay.id,
      nip11: nip11Data,
      rawJson: nip11Data,
    });
  }

  return c.json({ success: true, data: newRelay }, 201);
});

// ─── PUT /api/relays/:id — Update relay ───
relayRoutes.put('/:id', requireApiKey, zValidator('json', updateRelaySchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const fields = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(relays)
    .set({
      ...fields,
      updatedAt: new Date(),
    })
    .where(eq(relays.id, id))
    .returning();

  if (!updated) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  return c.json({ success: true, data: updated });
});

// ─── DELETE /api/relays/:id — Remove relay ───
relayRoutes.delete('/:id', requireApiKey, async (c) => {
  const id = c.req.param('id');

  const [deleted] = await db.delete(relays).where(eq(relays.id, id)).returning();

  if (!deleted) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  return c.json({ success: true, data: deleted });
});

// ─── POST /api/relays/:id/check — Run health check on a relay ───
relayRoutes.post('/:id/check', requireApiKey, async (c) => {
  const id = c.req.param('id');

  const [relay] = await db.select().from(relays).where(eq(relays.id, id)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  let httpUrl: string;
  let wsUrl: string;
  try {
    httpUrl = toHttpUrl(relay.url);
    wsUrl = toWsUrl(relay.url);
  } catch {
    return c.json({ success: false, error: 'Invalid or disallowed relay URL' }, 400);
  }

  let httpReachable = false;
  let corsConfigured = false;
  let websocketConnectable = false;
  let latencyMs: number | null = null;
  let httpStatusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const start = performance.now();
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000),
    });
    latencyMs = Math.round(performance.now() - start);
    httpReachable = res.ok;
    httpStatusCode = res.status;
    corsConfigured = true;
  } catch (e: unknown) {
    errorMessage = categorizeError(e);
  }

  try {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 5000);
      ws.onopen = () => {
        clearTimeout(timeout);
        websocketConnectable = true;
        ws.close();
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  } catch (e: unknown) {
    if (!errorMessage) errorMessage = categorizeError(e);
  }

  const [healthCheck] = await db
    .insert(healthChecks)
    .values({
      relayId: id,
      httpReachable,
      corsConfigured,
      websocketConnectable,
      latencyMs,
      httpStatusCode,
      errorMessage,
    })
    .returning();

  await db.update(relays).set({ updatedAt: new Date() }).where(eq(relays.id, id));

  return c.json({ success: true, data: healthCheck });
});

// ─── GET /api/relays/:id/history — Get health check history ───
relayRoutes.get('/:id/history', async (c) => {
  const id = c.req.param('id');
  const { limit } = parsePageLimit('1', c.req.query('limit') || '50');

  const history = await db
    .select()
    .from(healthChecks)
    .where(eq(healthChecks.relayId, id))
    .orderBy(desc(healthChecks.checkedAt))
    .limit(limit);

  return c.json({ success: true, data: history });
});

// ─── GET /api/relays/:id/nip11 — Get NIP-11 history ───
relayRoutes.get('/:id/nip11', async (c) => {
  const id = c.req.param('id');
  const { limit } = parsePageLimit('1', c.req.query('limit') || '20');

  const snapshots = await db
    .select()
    .from(relayInfoSnapshots)
    .where(eq(relayInfoSnapshots.relayId, id))
    .orderBy(desc(relayInfoSnapshots.fetchedAt))
    .limit(limit);

  return c.json({ success: true, data: snapshots });
});

export default relayRoutes;
