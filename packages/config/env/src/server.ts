import { z } from 'zod';

// ─── Server Environment Schema ───
// Single source of truth for all server-side env vars
//
// Development: everything has safe defaults, server boots without .env
// Production: enforce API_KEY + DATABASE_URL at startup

const DEFAULT_DATABASE_URL = 'postgresql://localhost:5432/relayscope';

const serverEnvSchema = z
  .object({
    // Database
    DATABASE_URL: z.string().url().default(DEFAULT_DATABASE_URL),
    POSTGRES_PASSWORD: z.string().min(1).default('postgres'),

    // API
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_KEY: z.string().min(1).optional(),
    CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

    // NIP-66 Monitor Relays (comma-separated WebSocket URLs)
    MONITOR_RELAYS: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (!env.API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['API_KEY'],
        message: 'API_KEY is required in production',
      });
    }

    if (env.DATABASE_URL === DEFAULT_DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required in production',
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate and parse server environment variables.
 * All fields have defaults — safe to call without any .env file.
 */
export function validateServerEnv(raw: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid server environment variables:\n${formatted}`);
  }
  return result.data;
}

/**
 * Get validated server env from Bun.env.
 */
export function getServerEnv(): ServerEnv {
  return validateServerEnv(Bun.env);
}
