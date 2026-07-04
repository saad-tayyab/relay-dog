/**
 * Shared test helpers for API integration tests.
 * Provides mock database objects and fixtures.
 *
 * Usage in each test file:
 *   import { mock } from 'bun:test';
 *   import { mockDb, mockQueries } from './helpers';
 *   mock.module('@relayscope/database', () => ({ db: mockDb }));
 *   mock.module('@relayscope/database/queries', () => mockQueries);
 *   import { createApp } from '../app';
 */

// ─── Constants ───

export const API_KEY = 'test-api-key-for-unit-tests';

// ─── Fixtures ───

export const FIXTURES = {
  relay: {
    id: 'relay-001',
    url: 'wss://relay.example.com',
    name: 'Test Relay',
    description: 'A test relay',
    icon: null,
    software: 'custom',
    version: '1.0',
    supportedNips: [1, 11, 42],
    limitations: null,
    isPublic: true,
    country: 'US',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  },
  relay2: {
    id: 'relay-002',
    url: 'wss://relay2.example.com',
    name: 'Test Relay 2',
    description: 'Another test relay',
    icon: null,
    software: 'custom',
    version: '2.0',
    supportedNips: [1, 42],
    limitations: null,
    isPublic: true,
    country: 'DE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  },
} as const;

// ─── Chainable Mock ───

/**
 * Creates a Proxy-based chainable that resolves to `result` when awaited.
 * Supports arbitrary method chaining (from, where, orderBy, limit, offset, etc.)
 * and resolves to `result` when awaited.
 */
export function chainable(result: unknown[] = []): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => unknown) => resolve(result);
      }
      if (prop === 'execute') {
        return async () => result;
      }
      return () => chainable(result);
    },
  };
  return new Proxy({}, handler);
}

// ─── Mock Database ───

type MockDb = {
  execute: () => Promise<never[]>;
  select: (selection?: unknown) => Record<string, unknown>;
  selectDistinct: (selection?: unknown) => Record<string, unknown>;
  insert: (table: unknown) => Record<string, unknown>;
  update: (table: unknown) => Record<string, unknown>;
  delete: (table: unknown) => Record<string, unknown>;
  transaction: (fn: (tx: MockDb) => unknown) => Promise<unknown>;
};

export const mockDb: MockDb = {
  execute: async () => [],
  select: (_selection?: unknown) => chainable([]),
  selectDistinct: (_selection?: unknown) => chainable([]),
  insert: (_table: unknown) => chainable([]),
  update: (_table: unknown) => chainable([]),
  delete: (_table: unknown) => chainable([]),
  transaction: async (fn) => fn(mockDb),
};

// ─── Mock Queries ───
// Smart mocks that return fixture data based on input.

export const mockQueries = {
  getRelayById: {
    execute: async ({ id }: { id: string }) => {
      if (id === FIXTURES.relay.id) return [FIXTURES.relay];
      if (id === FIXTURES.relay2.id) return [FIXTURES.relay2];
      return [];
    },
  },
  getRelayByUrl: {
    execute: async ({ url }: { url: string }) => {
      if (url === FIXTURES.relay.url) return [FIXTURES.relay];
      if (url === FIXTURES.relay2.url) return [FIXTURES.relay2];
      return [];
    },
  },
  getLatestInfo: {
    execute: async () => [],
  },
  getNip11History: {
    execute: async () => [],
  },
  getDiscoveriesByUrl: {
    execute: async () => [],
  },
  getLatestDiscovery: {
    execute: async () => [],
  },
};

// ─── Auth Header Helper ───

export function authHeaders(apiKey = API_KEY): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}
