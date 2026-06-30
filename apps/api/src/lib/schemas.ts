import { z } from 'zod';

const relayUrlSchema = z.string().trim().min(1, 'URL is required').max(500, 'URL too long');

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

export type CreateRelayInput = z.infer<typeof createRelaySchema>;
export type UpdateRelayInput = z.infer<typeof updateRelaySchema>;
