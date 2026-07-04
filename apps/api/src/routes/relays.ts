import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayDiscovered, relayInfoSnapshots, relays } from '../db/schema';
import { categorizeError } from '../lib/errors';
import { createRelaySchema, updateRelaySchema } from '../lib/schemas';
import { assertSafeUrl, assertSafeUrlResolved } from '../lib/ssrf';
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

async function toHttpUrl(url: string): Promise<string> {
  const httpUrl = url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
  await assertSafeUrlResolved(httpUrl);
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

  const paginatedRelays = await db
    .select()
    .from(relays)
    .where(whereClause)
    .orderBy(desc(relays.updatedAt))
    .limit(limit)
    .offset(offset);

  if (paginatedRelays.length === 0) {
    return c.json({
      success: true,
      data: [],
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  }

  return c.json({
    success: true,
    data: paginatedRelays,
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

  const [relay] = await db.select().from(relays).where(eq(relays.id, id)).limit(1);

  if (!relay) {
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
      ...relay,
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
    const httpUrl = await toHttpUrl(url);
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

// ─── POST /api/relays/:id/check — Run on-demand health check ───
relayRoutes.post('/:id/check', requireApiKey, async (c) => {
  const id = c.req.param('id');

  const [relay] = await db.select().from(relays).where(eq(relays.id, id)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  let httpUrl: string;
  let wsUrl: string;
  try {
    httpUrl = await toHttpUrl(relay.url);
    wsUrl = toWsUrl(relay.url);
  } catch {
    return c.json({ success: false, error: 'Invalid or disallowed relay URL' }, 400);
  }

  let rttOpen: number | null = null;
  let websocketConnectable = false;
  let errorMessage: string | null = null;

  try {
    const start = performance.now();
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000),
    });
    rttOpen = Math.round(performance.now() - start);
    if (!res.ok) {
      errorMessage = categorizeError(new Error(`HTTP ${res.status}`));
    }
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

  // Store as NIP-66 discovery with 'self' sentinel
  await db
    .insert(relayDiscovered)
    .values({
      relayUrl: relay.url,
      monitorPubkey: 'self',
      rttOpen,
      networkType: null,
    })
    .onConflictDoUpdate({
      target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
      set: {
        rttOpen,
        discoveredAt: new Date(),
      },
    });

  await db.update(relays).set({ updatedAt: new Date() }).where(eq(relays.id, id));

  return c.json({
    success: true,
    data: {
      relayUrl: relay.url,
      monitorPubkey: 'self',
      rttOpen,
      websocketConnectable,
      errorMessage,
    },
  });
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
