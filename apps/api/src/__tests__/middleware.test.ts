import { mock } from 'bun:test';
import { mockDb, mockQueries } from './helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../app';

const app = createApp();

describe('Root', () => {
  it('GET / returns API info', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Relay Scope API');
    expect(body.version).toBeDefined();
    expect(body.status).toBe('running');
    expect(body.timestamp).toBeDefined();
  });
});

describe('404 Handler', () => {
  it('GET /api/nonexistent returns 404', async () => {
    const res = await app.request('/api/nonexistent');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Not found');
  });

  it('GET /api/relays/unknown/path returns 404', async () => {
    const res = await app.request('/api/relays/unknown/path');
    expect(res.status).toBe(404);
  });
});

describe('Security Headers', () => {
  it('includes X-Content-Type-Options: nosniff', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('includes X-Frame-Options: DENY', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('includes Referrer-Policy', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('includes Content-Security-Policy', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  });

  it('includes Permissions-Policy', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('permissions-policy')).toContain('camera=()');
  });
});

describe('Rate Limiting', () => {
  it('GET returns 429 after exceeding read rate limit', async () => {
    // Send requests up to the rate limit (200/min for reads)
    const requests = Array.from({ length: 201 }, () => app.request('/api/health'));
    const responses = await Promise.all(requests);
    const tooMany = responses.filter((r) => r.status === 429);
    expect(tooMany.length).toBeGreaterThan(0);
  });
});
