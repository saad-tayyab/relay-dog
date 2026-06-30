import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { relations } from './schema';

if (!Bun.env.DATABASE_URL && Bun.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}

const DATABASE_URL = Bun.env.DATABASE_URL || 'postgresql://localhost:5432/relayscope';

const client = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({ client, relations });
