import { z } from 'zod';

// ─── Client Environment Schema ───
// Single source of truth for browser-side env vars (VITE_ prefixed)

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3001').describe('API base URL'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate and parse client environment variables.
 * Only validates VITE_ prefixed vars available in the browser.
 */
export function validateClientEnv(raw: Record<string, unknown>): ClientEnv {
  const result = clientEnvSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid client environment variables:\n${formatted}`);
  }
  return result.data;
}

/**
 * Get validated client env from import.meta.env.
 */
export function getClientEnv(): ClientEnv {
  return validateClientEnv(import.meta.env);
}
