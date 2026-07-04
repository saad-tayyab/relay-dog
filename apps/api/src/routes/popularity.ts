import { zValidator } from '@hono/zod-validator';
import { eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { getRelayById } from '../db/queries';
import { relayListEntries } from '../db/schema';
import { createPopularitySchema } from '../lib/schemas';
import { requireApiKey } from '../middleware/auth';

const popularityRoutes = new Hono();

// ─── Shared conditions ───
function relayUrlIs(url: string) {
  return eq(relayListEntries.relayUrl, url);
}

function markerIs(marker: 'read' | 'write') {
  return or(eq(relayListEntries.marker, marker), sql`${relayListEntries.marker} IS NULL`);
}

// ─── GET /:id/popularity — Get read/write relay counts ───
popularityRoutes.get('/:id/popularity', async (c) => {
  const relayId = c.req.param('id');

  const [relay] = await getRelayById.execute({ id: relayId });
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const urlCondition = relayUrlIs(relay.url);

  const [{ readCount }] = await db
    .select({ readCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(sql`${urlCondition} AND ${markerIs('read')}`);

  const [{ writeCount }] = await db
    .select({ writeCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(sql`${urlCondition} AND ${markerIs('write')}`);

  const readers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(sql`${urlCondition} AND ${markerIs('read')}`)
    .limit(10);

  const writers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(sql`${urlCondition} AND ${markerIs('write')}`)
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

// ─── POST /:id/popularity — Upsert relay list entry ───
popularityRoutes.post(
  '/:id/popularity',
  requireApiKey,
  zValidator('json', createPopularitySchema),
  async (c) => {
    const relayId = c.req.param('id');
    const body = c.req.valid('json');

    const [relay] = await getRelayById.execute({ id: relayId });
    if (!relay) {
      return c.json({ success: false, error: 'Relay not found' }, 404);
    }

    const [result] = await db
      .insert(relayListEntries)
      .values({
        authorPubkey: body.authorPubkey,
        relayUrl: relay.url,
        marker: body.marker ?? null,
      })
      .onConflictDoUpdate({
        target: [relayListEntries.authorPubkey, relayListEntries.relayUrl],
        set: {
          marker: body.marker ?? null,
          listedAt: new Date(),
        },
      })
      .returning();

    return c.json({ success: true, data: result }, 201);
  },
);

export default popularityRoutes;
