import { describe, expect, it } from 'bun:test';
import { NostrEventSchema, PaginationSchema, RelayNip11Schema } from '../schemas';

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
