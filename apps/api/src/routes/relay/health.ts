import { requireApiKey } from '@relayscope/auth';
import { db } from '@relayscope/database';
import { getNip11History, getRelayById } from '@relayscope/database/queries';
import { relayDiscovered, relays } from '@relayscope/database/schema';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { categorizeError } from '../../lib/errors';
import { parsePageLimit, toHttpUrl, toWsUrl } from '../../lib/utils';

const healthRoutes = new Hono();

// ─── POST /:id/check — Run on-demand health check ───
healthRoutes.post('/:id/check', requireApiKey, async (c) => {
  const id = c.req.param('id');

  const [relay] = await getRelayById.execute({ id });
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

// ─── GET /:id/nip11 — Get NIP-11 history ───
healthRoutes.get('/:id/nip11', async (c) => {
  const id = c.req.param('id');
  const { limit } = parsePageLimit('1', c.req.query('limit') || '20');

  const snapshots = await getNip11History.execute({ relayId: id, limit });

  return c.json({ success: true, data: snapshots });
});

export default healthRoutes;
