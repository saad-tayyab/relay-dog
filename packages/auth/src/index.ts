import { timingSafeEqual } from 'node:crypto';
import { getServerEnv } from '@relayscope/env/server';
import { createMiddleware } from 'hono/factory';

/**
 * Requires `Authorization: Bearer <API_KEY>` on mutating routes.
 * In production, API_KEY must be set at startup (see index.ts).
 * In development, requests are allowed when API_KEY is unset (with a one-time warning).
 */
export const requireApiKey = createMiddleware(async (c, next) => {
  const env = getServerEnv();
  const expected = env.API_KEY;

  if (!expected) {
    if (env.NODE_ENV === 'production') {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    // Dev-only: allow through, but warning was logged at startup (see index.ts)
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (
    !token ||
    token.length !== expected.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  await next();
});
