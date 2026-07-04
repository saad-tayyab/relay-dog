/**
 * Test environment setup — loaded before tests via --preload.
 * Sets NODE_ENV=test and provides safe defaults for env vars.
 */

// Force test environment
Bun.env.NODE_ENV = 'test';

// Always force a known test API_KEY so auth tests are deterministic
Bun.env.API_KEY = 'test-api-key-for-unit-tests';

// Provide a DATABASE_URL if not already set (uses the dev database by default)
if (!Bun.env.DATABASE_URL) {
  Bun.env.DATABASE_URL = 'postgresql://localhost:5432/relayscope';
}
