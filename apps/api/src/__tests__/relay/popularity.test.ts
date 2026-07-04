import { mock } from 'bun:test';
import { authHeaders, FIXTURES, mockDb, mockQueries } from '../helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../../app';

const app = createApp();

describe('Relay Popularity — GET', () => {
  it('GET /api/relays/:id/popularity returns counts and pubkeys', async () => {
    const res = await app.request(`/api/relays/${FIXTURES.relay.id}/popularity`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.readCount).toBe('number');
    expect(typeof body.data.writeCount).toBe('number');
    expect(Array.isArray(body.data.readers)).toBe(true);
    expect(Array.isArray(body.data.writers)).toBe(true);
  });

  it('GET /api/relays/:id/popularity returns 404 when relay not found', async () => {
    const res = await app.request('/api/relays/nonexistent/popularity');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Relay not found');
  });
});

describe('Relay Popularity — POST', () => {
  it('POST /api/relays/:id/popularity without auth returns 401', async () => {
    const res = await app.request(`/api/relays/${FIXTURES.relay.id}/popularity`, {
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/relays/:id/popularity with auth but empty body returns 400', async () => {
    const res = await app.request(`/api/relays/${FIXTURES.relay.id}/popularity`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/relays/:id/popularity with invalid pubkey returns 400', async () => {
    const res = await app.request(`/api/relays/${FIXTURES.relay.id}/popularity`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorPubkey: 'not-a-valid-hex-key' }),
    });
    expect(res.status).toBe(400);
  });
});
