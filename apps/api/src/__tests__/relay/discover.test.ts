import { mock } from 'bun:test';
import { FIXTURES, mockDb, mockQueries } from '../helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../../app';

const app = createApp();

describe('Relay Discoveries', () => {
  it('GET /api/relays/:id/discoveries returns discoveries with stats', async () => {
    const res = await app.request(`/api/relays/${FIXTURES.relay.id}/discoveries`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.discoveries)).toBe(true);
    expect(body.data.stats).toBeDefined();
    expect(typeof body.data.stats.monitorCount).toBe('number');
    expect(body.data.stats.avgRttOpen).toBeNull();
    expect(body.data.stats.avgRttRead).toBeNull();
    expect(body.data.stats.avgRttWrite).toBeNull();
  });

  it('GET /api/relays/:id/discoveries returns 404 when relay not found', async () => {
    const res = await app.request('/api/relays/nonexistent/discoveries');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Relay not found');
  });
});
