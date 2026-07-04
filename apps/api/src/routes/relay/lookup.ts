import { getRelayByUrl } from '@relayscope/database/queries';
import { Hono } from 'hono';

const lookupRoutes = new Hono();

// ─── GET /lookup — Find relay by URL ───
lookupRoutes.get('/lookup', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ success: false, error: 'url query parameter is required' }, 400);
  }
  const normalized = url.trim().replace(/\/+$/, '');
  const [relay] = await getRelayByUrl.execute({ url: normalized });
  if (!relay) {
    const withSlash = `${normalized}/`;
    const [relayAlt] = await getRelayByUrl.execute({ url: withSlash });
    if (relayAlt) {
      return c.json({ success: true, data: { id: relayAlt.id, url: relayAlt.url } });
    }
    return c.json({ success: false, data: null });
  }
  return c.json({ success: true, data: { id: relay.id, url: relay.url } });
});

export default lookupRoutes;
