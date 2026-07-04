import { mock } from 'bun:test';
import { authHeaders, mockDb, mockQueries } from '../helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../../app';

const app = createApp();

describe('Relay Health Check', () => {
  it('POST /api/relays/:id/check without auth returns 401', async () => {
    const res = await app.request('/api/relays/relay-001/check', {
      method: 'POST',
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('POST /api/relays/nonexistent/check with auth returns 404', async () => {
    const res = await app.request('/api/relays/nonexistent/check', {
      method: 'POST',
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Relay not found');
  });
});

describe('NIP-11 History', () => {
  it('GET /api/relays/:id/nip11 returns snapshot list', async () => {
    const res = await app.request('/api/relays/relay-001/nip11');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/relays/:id/nip11?limit=5 respects limit param', async () => {
    const res = await app.request('/api/relays/relay-001/nip11?limit=5');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
