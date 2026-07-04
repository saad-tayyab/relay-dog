import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { relayDiscovered, relays } from '../db/schema';

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

export default discoverRoutes;
