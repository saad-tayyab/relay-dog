import { drizzle } from 'drizzle-orm/bun-sql';

if (!Bun.env.DATABASE_URL && Bun.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}

const DATABASE_URL = Bun.env.DATABASE_URL || 'postgresql://localhost:5432/relayscope';

export const db = drizzle(DATABASE_URL, { jit: true });
