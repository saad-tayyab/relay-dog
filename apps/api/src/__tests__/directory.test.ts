import { mock } from 'bun:test';
import { FIXTURES, mockDb, mockQueries } from './helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../app';

const app = createApp();

describe('Directory — List', () => {
  it('GET /api/directory returns list response', async () => {
    const res = await app.request('/api/directory');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.relays).toBeDefined();
    expect(Array.isArray(body.data.relays)).toBe(true);
    expect(typeof body.data.total).toBe('number');
    expect(body.data.page).toBe(1);
  });

  it('GET /api/directory?search=test includes search param', async () => {
    const res = await app.request('/api/directory?search=test');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/directory?sortBy=url&sortOrder=desc respects sort params', async () => {
    const res = await app.request('/api/directory?sortBy=url&sortOrder=desc');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/directory?sortBy=lastChecked respects sort param', async () => {
    const res = await app.request('/api/directory?sortBy=lastChecked');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe('Directory — Countries', () => {
  it('GET /api/directory/countries returns country list', async () => {
    const res = await app.request('/api/directory/countries');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe('Directory — Compare', () => {
  it('GET /api/directory/compare/:id1/:id2 returns comparison', async () => {
    const res = await app.request(
      `/api/directory/compare/${FIXTURES.relay.id}/${FIXTURES.relay2.id}`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.relayA).toBeDefined();
    expect(body.data.relayB).toBeDefined();
    expect(body.data.diff).toBeDefined();
    expect(body.data.diff.nipsOnlyInA).toBeDefined();
    expect(body.data.diff.nipsOnlyInB).toBeDefined();
    expect(body.data.diff.sharedNips).toBeDefined();
    expect(body.data.diff.latencyWinner).toBeDefined();
  });

  it('GET /api/directory/compare/:id1/:id2 returns 404 when either relay not found', async () => {
    const res = await app.request(`/api/directory/compare/${FIXTURES.relay.id}/nonexistent`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
