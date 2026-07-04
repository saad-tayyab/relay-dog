import { getServerEnv } from '@relayscope/env/server';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimiter } from 'hono-rate-limiter';
import { db } from './db';
import { startNip66Ingestor } from './jobs/nip66Ingestor';
import { log } from './lib/log';
import directoryRoutes from './routes/directory';
import discoverRoutes from './routes/discover';
import popularityRoutes from './routes/popularity';
import relayRoutes from './routes/relays';

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

const isProduction = env.NODE_ENV === 'production';

const app = new Hono();

function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'
  );
}

const writeRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: clientIp,
  message: { success: false, error: 'Too many requests' },
});

const readRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  limit: 200,
  keyGenerator: clientIp,
  message: { success: false, error: 'Too many requests' },
});

// ─── Middleware ───
if (!isProduction) {
  app.use('*', logger());
}

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use('/api/*', async (c, next) => {
  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method);
  if (isWrite) {
    return writeRateLimit(c, next);
  }
  return readRateLimit(c, next);
});

// ─── Body Size Limit ───
app.use('/api/*', bodyLimit({ maxSize: 100 * 1024 })); // 100KB max body

// ─── Security Headers ───
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});

// ─── Routes ───

app.get('/', (c) => {
  return c.json({
    name: 'Relay Scope API',
    version: '0.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (c) => {
  const checks: Record<string, string> = { api: 'ok' };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  const allHealthy = Object.values(checks).every((v) => v !== 'disconnected');
  const statusCode = allHealthy ? 200 : 503;

  return c.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      checks,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
});

app.route('/api/relays', relayRoutes);
app.route('/api/relays', discoverRoutes);
app.route('/api/relays', popularityRoutes);
app.route('/api/directory', directoryRoutes);

// ─── 404 Handler ───
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// ─── Error Handler ───
app.onError((err, c) => {
  // Always log full error server-side
  log({ level: 'error', msg: 'Request error', error: err.stack ?? err.message ?? String(err) });
  // Never expose internal error details to clients
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

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
