import { describe, expect, it } from 'bun:test';
import {
  AuthEventSchema,
  NostrEventSchema,
  PaginationSchema,
  RelayDiscoverySchema,
  RelayFeesSchema,
  RelayListEventSchema,
  RelayNip11Schema,
} from '../schemas';

describe('RelayNip11Schema', () => {
  it('accepts valid minimal NIP-11 object', () => {
    const result = RelayNip11Schema.safeParse({
      name: 'Test Relay',
      description: 'A test relay',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name longer than 30 characters', () => {
    const result = RelayNip11Schema.safeParse({
      name: 'A'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid limitation fields', () => {
    const result = RelayNip11Schema.safeParse({
      name: 'Relay',
      limitation: {
        max_message_length: 131072,
        max_subscriptions: 20,
        auth_required: false,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('NostrEventSchema', () => {
  it('accepts a valid event', () => {
    const result = NostrEventSchema.safeParse({
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: 1700000000,
      kind: 1,
      tags: [['e', 'abc']],
      content: 'Hello',
      sig: 'c'.repeat(128),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid id length', () => {
    const result = NostrEventSchema.safeParse({
      id: 'abc',
      pubkey: 'b'.repeat(64),
      created_at: 1700000000,
      kind: 1,
      tags: [],
      content: 'Hello',
      sig: 'c'.repeat(128),
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-hex id', () => {
    const result = NostrEventSchema.safeParse({
      id: 'g'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: 1700000000,
      kind: 1,
      tags: [],
      content: 'Hello',
      sig: 'c'.repeat(128),
    });
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('applies defaults for missing fields', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('name');
      expect(result.data.sortOrder).toBe('asc');
    }
  });

  it('coerces string numbers', () => {
    const result = PaginationSchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit > 100', () => {
    const result = PaginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects page < 1', () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('RelayFeesSchema', () => {
  it('accepts valid fee structure', () => {
    const result = RelayFeesSchema.safeParse({
      admission: [{ amount: 1000, unit: 'sats' }],
      subscription: [{ kinds: [1], amount: 500, unit: 'msats' }],
      publication: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty fees object', () => {
    const result = RelayFeesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = RelayFeesSchema.safeParse({
      admission: [{ amount: -1, unit: 'sats' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid unit', () => {
    const result = RelayFeesSchema.safeParse({
      admission: [{ amount: 100, unit: 'btc' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('RelayDiscoverySchema', () => {
  const validDiscovery = {
    kind: 30166,
    tags: [['relay', 'wss://relay.example.com']],
    content: '',
    pubkey: 'a'.repeat(64),
    created_at: 1700000000,
  };

  it('accepts valid discovery event', () => {
    const result = RelayDiscoverySchema.safeParse(validDiscovery);
    expect(result.success).toBe(true);
  });

  it('rejects wrong kind', () => {
    const result = RelayDiscoverySchema.safeParse({ ...validDiscovery, kind: 1 });
    expect(result.success).toBe(false);
  });
});

describe('RelayListEventSchema', () => {
  const validList = {
    kind: 10002,
    tags: [['r', 'wss://relay.example.com', 'read']],
    content: '',
    pubkey: 'a'.repeat(64),
    created_at: 1700000000,
  };

  it('accepts valid relay list event', () => {
    const result = RelayListEventSchema.safeParse(validList);
    expect(result.success).toBe(true);
  });

  it('rejects wrong kind', () => {
    const result = RelayListEventSchema.safeParse({ ...validList, kind: 10001 });
    expect(result.success).toBe(false);
  });
});

describe('AuthEventSchema', () => {
  const validAuth = {
    kind: 22242,
    content: '',
    tags: [['relay', 'wss://relay.example.com']],
    created_at: 1700000000,
  };

  it('accepts valid auth event', () => {
    const result = AuthEventSchema.safeParse(validAuth);
    expect(result.success).toBe(true);
  });

  it('rejects non-empty content', () => {
    const result = AuthEventSchema.safeParse({ ...validAuth, content: 'not empty' });
    expect(result.success).toBe(false);
  });

  it('rejects wrong kind', () => {
    const result = AuthEventSchema.safeParse({ ...validAuth, kind: 22243 });
    expect(result.success).toBe(false);
  });
});
