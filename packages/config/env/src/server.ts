import { z } from 'zod';

// ─── Server Environment Schema ───
// Single source of truth for all server-side env vars

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe('PostgreSQL connection URL'),
  POSTGRES_PASSWORD: z.string().min(1).describe('PostgreSQL password'),

  // API
  PORT: z.coerce.number().int().min(1).max(65535).default(3001).describe('API server port'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_KEY: z.string().min(1).describe('API authentication key'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:3000')
    .describe('Comma-separated CORS origins'),

  // Relay Monitor
  MONITOR_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(60000)
    .describe('Monitor check interval in milliseconds'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate and parse server environment variables.
 * Throws a descriptive error if validation fails.
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
 * Get validated server env from process.env.
 */
export function getServerEnv(): ServerEnv {
  return validateServerEnv(process.env);
}
