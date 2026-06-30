import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { relations } from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/relayscope';

// postgres.js client with connection pool config
const client = postgres(DATABASE_URL, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Drizzle ORM instance — v1 RC uses object syntax
export const db = drizzle({ client, relations });

export { DATABASE_URL };
