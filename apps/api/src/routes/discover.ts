import { Hono } from 'hono';
import { getDiscoveriesByUrl, getRelayById } from '../db/queries';
import type { RelayDiscovery } from '../db/schema';

const discoverRoutes = new Hono();

// ─── GET /:id/discoveries — Get monitor observations for a relay ───
discoverRoutes.get('/:id/discoveries', async (c) => {
  const relayId = c.req.param('id');

  const [relay] = await getRelayById.execute({ id: relayId });
  if (!relay) {
    return c.json({ success: false, error: 'Relay not found' }, 404);
  }

  const discoveries = await getDiscoveriesByUrl.execute({ relayUrl: relay.url });

  const monitorCount = new Set(discoveries.map((d: RelayDiscovery) => d.monitorPubkey)).size;
  const avgRttOpen =
    discoveries.reduce((sum: number, d: RelayDiscovery) => sum + (d.rttOpen || 0), 0) /
      discoveries.length || null;
  const avgRttRead =
    discoveries.reduce((sum: number, d: RelayDiscovery) => sum + (d.rttRead || 0), 0) /
      discoveries.length || null;
  const avgRttWrite =
    discoveries.reduce((sum: number, d: RelayDiscovery) => sum + (d.rttWrite || 0), 0) /
      discoveries.length || null;

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
