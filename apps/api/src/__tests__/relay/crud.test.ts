import { mock } from 'bun:test';
import { authHeaders, mockDb, mockQueries } from '../helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../../app';

const app = createApp();

describe('Relays — List', () => {
  it('GET /api/relays returns list with meta', async () => {
    const res = await app.request('/api/relays');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.total).toBeDefined();
    expect(body.meta.totalPages).toBeDefined();
  });

  it('GET /api/relays?search=test includes search param', async () => {
    const res = await app.request('/api/relays?search=test');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/relays?page=2&limit=10 respects pagination', async () => {
    const res = await app.request('/api/relays?page=2&limit=10');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
  });
});

describe('Relays — Get by ID', () => {
  it('GET /api/relays/:id returns relay when found', async () => {
    const res = await app.request('/api/relays/relay-001');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('relay-001');
    expect(body.data.url).toBe('wss://relay.example.com');
  });

  it('GET /api/relays/:id returns 404 when not found', async () => {
    const res = await app.request('/api/relays/nonexistent');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Relay not found');
  });
});

describe('Relays — Auth Guards', () => {
  it('POST /api/relays without auth returns 401', async () => {
    const res = await app.request('/api/relays', { method: 'POST' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('POST /api/relays with invalid token returns 401', async () => {
    const res = await app.request('/api/relays', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-token' },
    });
    expect(res.status).toBe(401);
  });

  it('PUT /api/relays/:id without auth returns 401', async () => {
    const res = await app.request('/api/relays/relay-001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/relays/:id without auth returns 401', async () => {
    const res = await app.request('/api/relays/relay-001', {
      method: 'DELETE',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/relays with auth but empty body returns 400', async () => {
    const res = await app.request('/api/relays', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('PUT /api/relays/:id with auth but invalid body returns 400', async () => {
    const res = await app.request('/api/relays/relay-001', {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    });
    expect(res.status).toBe(400);
  });
});
