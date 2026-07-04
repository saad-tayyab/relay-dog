import { getServerEnv } from '@relayscope/env/server';
import { createApp } from './app';
import { startNip66Ingestor } from './jobs/nip66Ingestor';
import { log } from './lib/log';

// ─── Validate environment at startup (single source of truth) ───
const env = getServerEnv();

if (env.NODE_ENV === 'production' && !env.API_KEY) {
  log({ level: 'error', msg: 'API_KEY is required in production' });
  process.exit(1);
}

if (env.NODE_ENV !== 'production' && !env.API_KEY) {
  log({
    level: 'warn',
    msg: 'API_KEY is not set — write endpoints are UNPROTECTED in development',
  });
}

const app = createApp();

// ─── Start Server ───
const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

// Graceful shutdown — Bun-native pattern
process.on('SIGTERM', () => server.stop());
process.on('SIGINT', () => server.stop());

log({ level: 'info', msg: 'Server started', port: env.PORT });

// NIP-66 ingestor: subscribes to monitor relays for passive health data
startNip66Ingestor();
