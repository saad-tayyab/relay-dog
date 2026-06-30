import { z } from 'zod';

const relayUrlSchema = z.string().trim().min(1, 'URL is required').max(500, 'URL too long');
const hex64Schema = z.string().regex(/^[0-9a-f]{64}$/, 'Must be a 64-character hex string');

export const createRelaySchema = z.object({
  url: relayUrlSchema,
  name: z.string().trim().max(200).optional(),
  isPublic: z.boolean().optional(),
});

export const updateRelaySchema = z.object({
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  isPublic: z.boolean().optional(),
  country: z.string().trim().max(100).optional(),
});

export const createDiscoverySchema = z.object({
  monitorPubkey: hex64Schema,
  rttOpen: z.number().int().min(0).max(120_000).nullable().optional(),
  rttRead: z.number().int().min(0).max(120_000).nullable().optional(),
  rttWrite: z.number().int().min(0).max(120_000).nullable().optional(),
  networkType: z.string().max(50).nullable().optional(),
  relayType: z.string().max(50).nullable().optional(),
  supportedNips: z.array(z.number().int().min(1).max(65535)).max(100).optional(),
  requirements: z.array(z.string().max(100)).max(50).optional(),
  topics: z.array(z.string().max(100)).max(50).optional(),
  geohash: z.string().max(12).nullable().optional(),
});

export const createPopularitySchema = z.object({
  authorPubkey: hex64Schema,
  marker: z.enum(['read', 'write']).nullable().optional(),
});

export type CreateRelayInput = z.output<typeof createRelaySchema>;
export type UpdateRelayInput = z.output<typeof updateRelaySchema>;
