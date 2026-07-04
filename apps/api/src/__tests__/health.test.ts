import { mock } from 'bun:test';
import { mockDb, mockQueries } from './helpers';

mock.module('@relayscope/database', () => ({ db: mockDb }));
mock.module('@relayscope/database/queries', () => mockQueries);

import { describe, expect, it } from 'bun:test';
import { createApp } from '../app';

const app = createApp();

describe('Health', () => {
  it('GET /api/health returns ok with status 200', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.checks).toBeDefined();
    expect(body.checks.api).toBe('ok');
    expect(body.checks.database).toBe('connected');
    expect(typeof body.uptime).toBe('number');
    expect(body.timestamp).toBeDefined();
  });
});
