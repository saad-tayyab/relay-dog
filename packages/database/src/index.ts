import { getServerEnv } from '@relayscope/env/server';
import { drizzle } from 'drizzle-orm/bun-sql';

const env = getServerEnv();

if (!env.DATABASE_URL && env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}

const DATABASE_URL = env.DATABASE_URL || 'postgresql://localhost:5432/relayscope';

export const db = drizzle(DATABASE_URL, { jit: true });
