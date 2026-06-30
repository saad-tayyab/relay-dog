import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayListEntries, relays } from '../db/schema';
import { createPopularitySchema } from '../lib/schemas';
import { requireApiKey } from '../middleware/auth';

const popularityRoutes = new Hono();

// ─── GET /:id/popularity — Get read/write relay counts ───
popularityRoutes.get('/:id/popularity', async (c) => {
  const relayId = c.req.param('id');

  const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const [{ readCount }] = await db
    .select({ readCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(
      sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'read' OR ${relayListEntries.marker} IS NULL)`,
    );

  const [{ writeCount }] = await db
    .select({ writeCount: sql<number>`count(*)::int` })
    .from(relayListEntries)
    .where(
      sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'write' OR ${relayListEntries.marker} IS NULL)`,
    );

  const readers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(
      sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'read' OR ${relayListEntries.marker} IS NULL)`,
    )
    .limit(10);

  const writers = await db
    .select({ authorPubkey: relayListEntries.authorPubkey })
    .from(relayListEntries)
    .where(
      sql`${relayListEntries.relayUrl} = ${relay.url} AND (${relayListEntries.marker} = 'write' OR ${relayListEntries.marker} IS NULL)`,
    )
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

    const [relay] = await db.select().from(relays).where(eq(relays.id, relayId)).limit(1);
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
