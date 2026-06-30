import { z } from 'zod';

// ─── NIP-11 Schemas ───

export const RelayLimitationSchema = z.object({
  max_message_length: z.number().int().positive().optional(),
  max_subscriptions: z.number().int().positive().optional(),
  max_filters: z.number().int().positive().optional(),
  max_limit: z.number().int().positive().optional(),
  max_subid_length: z.number().int().positive().optional(),
  max_event_tags: z.number().int().positive().optional(),
  max_content_length: z.number().int().positive().optional(),
  min_pow_difficulty: z.number().int().min(0).optional(),
  auth_required: z.boolean().optional(),
  payment_required: z.boolean().optional(),
  restricted_writes: z.boolean().optional(),
  created_at_lower_limit: z.number().int().optional(),
  created_at_upper_limit: z.number().int().optional(),
  default_limit: z.number().int().positive().optional(),
});

export const RelayFeeEntrySchema = z.object({
  kinds: z.array(z.number().int()).optional(),
  amount: z.number().int().min(0),
  unit: z.enum(['msats', 'sats']),
  period: z.number().int().positive().optional(),
});

export const RelayFeesSchema = z.object({
  admission: z.array(RelayFeeEntrySchema).optional(),
  subscription: z.array(RelayFeeEntrySchema).optional(),
  publication: z.array(RelayFeeEntrySchema).optional(),
});

export const RelayNip11Schema = z
  .object({
    name: z.string().max(30).optional(),
    description: z.string().optional(),
    banner: z.url().optional(),
    icon: z.url().optional(),
    pubkey: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .optional(),
    self: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .optional(),
    contact: z.string().optional(),
    supported_nips: z.array(z.number().int().min(1)).optional(),
    software: z.string().optional(),
    version: z.string().optional(),
    terms_of_service: z.url().optional(),
    limitation: RelayLimitationSchema.optional(),
    payments_url: z.url().optional(),
    fees: RelayFeesSchema.optional(),
  })
  .passthrough();

// ─── NIP-01 Event Schema ───

export const NostrEventSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
  created_at: z.number().int().min(0),
  kind: z.number().int().min(0),
  tags: z.array(z.array(z.string().nullable()).min(1)),
  content: z.string(),
  sig: z.string().regex(/^[0-9a-f]{128}$/),
});

// ─── NIP-66 Discovery Schema ───

export const RelayDiscoverySchema = z
  .object({
    kind: z.literal(30166),
    tags: z.array(z.array(z.string())),
    content: z.string(),
    pubkey: z.string().regex(/^[0-9a-f]{64}$/),
    created_at: z.number().int(),
  })
  .passthrough();

// ─── NIP-65 Relay List Schema ───

export const RelayListEventSchema = z
  .object({
    kind: z.literal(10002),
    tags: z.array(z.array(z.string())),
    content: z.string(),
    pubkey: z.string().regex(/^[0-9a-f]{64}$/),
    created_at: z.number().int(),
  })
  .passthrough();

// ─── NIP-42 Auth Event Schema ───

export const AuthEventSchema = z
  .object({
    kind: z.literal(22242),
    content: z.literal(''),
    tags: z.array(z.array(z.string())),
    created_at: z.number().int(),
  })
  .passthrough();

// ─── Pagination Schema ───

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'url', 'lastChecked', 'latency']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
