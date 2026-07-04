import { defineConfig } from 'drizzle-kit';

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required. Set it in your .env or shell environment.',
  );
}

export default defineConfig({
  schema: '../../packages/database/src/schema.ts',
  out: '../../packages/database/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
