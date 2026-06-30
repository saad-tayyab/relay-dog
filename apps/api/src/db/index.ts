import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { relations } from './schema';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  process.stderr.write('DATABASE_URL is required in production\n');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/relayscope';

const client = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({ client, relations });
