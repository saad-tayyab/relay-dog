import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayDiscovered, relays } from '../db/schema';
import { requireApiKey } from '../middleware/auth';

const discoverRoutes = new Hono();

// ─── GET /:id/discoveries — Get monitor observations for a relay ───
discoverRoutes.get('/:id/discoveries', async (c) => {
  const relayId = c.req.param('id');

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

  const monitorCount = new Set(discoveries.map((d) => d.monitorPubkey)).size;
  const avgRttOpen =
    discoveries.reduce((sum, d) => sum + (d.rttOpen || 0), 0) / discoveries.length || null;
  const avgRttRead =
    discoveries.reduce((sum, d) => sum + (d.rttRead || 0), 0) / discoveries.length || null;
  const avgRttWrite =
    discoveries.reduce((sum, d) => sum + (d.rttWrite || 0), 0) / discoveries.length || null;

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

// ─── POST /:id/discoveries — Upsert discovery from monitor ───
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
