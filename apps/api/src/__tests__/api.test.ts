import { describe, expect, it } from 'bun:test';
import { createApp } from '../app';

const app = createApp();

describe('Health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

describe('Relays', () => {
  it('GET /api/relays returns a list response', async () => {
    const res = await app.request('/api/relays');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
  });

  it('POST /api/relays requires auth', async () => {
    const res = await app.request('/api/relays', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});

describe('Directory', () => {
  it('GET /api/directory returns a successful response', async () => {
    const res = await app.request('/api/directory');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
