import { zValidator } from '@hono/zod-validator';
import { requireApiKey } from '@relayscope/auth';
import { db } from '@relayscope/database';
import { getLatestInfo, getRelayById, getRelayByUrl } from '@relayscope/database/queries';
import { relayInfoSnapshots, relays } from '@relayscope/database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { createRelaySchema, updateRelaySchema } from '../../lib/schemas';
import { normalizeRelayUrl, parsePageLimit, toHttpUrl } from '../../lib/utils';

const crudRoutes = new Hono();

// ─── GET / — List all relays with optional filters ───
crudRoutes.get('/', async (c) => {
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

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relays)
    .where(whereClause);
  const count = countRow?.count ?? 0;

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

// ─── GET /:id — Get single relay ───
crudRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [relay] = await getRelayById.execute({ id });

  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const [latestInfo] = await getLatestInfo.execute({ relayId: id });

  return c.json({
    success: true,
    data: {
      ...relay,
      latestInfo: latestInfo || null,
    },
  });
});

// ─── POST / — Add a new relay ───
crudRoutes.post('/', requireApiKey, zValidator('json', createRelaySchema), async (c) => {
  const body = c.req.valid('json');

  let url: string;
  try {
    url = normalizeRelayUrl(body.url);
  } catch {
    return c.json({ success: false, error: 'Invalid or disallowed relay URL' }, 400);
  }

  const [existing] = await getRelayByUrl.execute({ url });
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

  const newRelay = await db.transaction(async (tx) => {
    const [relay] = await tx
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

    if (!relay) throw new Error('Failed to create relay');

    if (Object.keys(nip11Data).length > 0) {
      await tx.insert(relayInfoSnapshots).values({
        relayId: relay.id,
        nip11: nip11Data,
        rawJson: nip11Data,
      });
    }

    return relay;
  });

  return c.json({ success: true, data: newRelay }, 201);
});

// ─── PUT /:id — Update relay ───
crudRoutes.put('/:id', requireApiKey, zValidator('json', updateRelaySchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const [updated] = await db
    .update(relays)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && {
        description: body.description,
      }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.country !== undefined && { country: body.country }),
      updatedAt: new Date(),
    })
    .where(eq(relays.id, id))
    .returning();

  if (!updated) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  return c.json({ success: true, data: updated });
});

// ─── DELETE /:id — Remove relay ───
crudRoutes.delete('/:id', requireApiKey, async (c) => {
  const id = c.req.param('id');

  const [deleted] = await db.delete(relays).where(eq(relays.id, id)).returning();

  if (!deleted) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  return c.json({ success: true, data: deleted });
});

export default crudRoutes;
