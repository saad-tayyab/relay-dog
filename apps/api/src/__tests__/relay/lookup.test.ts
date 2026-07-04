import { mock } from 'bun:test';
import { FIXTURES, mockDb, mockQueries } from '../helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../../app';

const app = createApp();

describe('Relay Lookup', () => {
  it('GET /api/relays/lookup?url=... returns relay when found', async () => {
    const url = encodeURIComponent(FIXTURES.relay.url);
    const res = await app.request(`/api/relays/lookup?url=${url}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(FIXTURES.relay.id);
    expect(body.data.url).toBe(FIXTURES.relay.url);
  });

  it('GET /api/relays/lookup without url returns 400', async () => {
    const res = await app.request('/api/relays/lookup');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('GET /api/relays/lookup?url=... returns success:false when not found', async () => {
    const url = encodeURIComponent('wss://nonexistent.example.com');
    const res = await app.request(`/api/relays/lookup?url=${url}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
  });
});
