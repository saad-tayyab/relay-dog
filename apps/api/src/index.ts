import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { rateLimiter } from 'hono-rate-limiter';
import { db } from './db';
import { relays } from './db/schema';
import { startMonitor } from './jobs/relayMonitor';
import directoryRoutes from './routes/directory';
import discoverRoutes from './routes/discover';
import popularityRoutes from './routes/popularity';
import relayRoutes from './routes/relays';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.API_KEY) {
  process.stderr.write('API_KEY is required in production\n');
  process.exit(1);
}

if (!isProduction && !process.env.API_KEY) {
  process.stderr.write(
    '⚠️  WARNING: API_KEY is not set — write endpoints are UNPROTECTED in development\n',
  );
}

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

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

if (!isProduction) {
  app.use('/api/*', prettyJSON());
}

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

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Relay Lookup by URL ───
app.get('/api/relays/lookup', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ success: false, error: 'url query parameter is required' }, 400);
  }
  // Normalize: strip trailing slashes and whitespace
  const normalized = url.trim().replace(/\/+$/, '');
  const [relay] = await db.select().from(relays).where(eq(relays.url, normalized)).limit(1);
  if (!relay) {
    // Fallback: try with trailing slash (some DBs store normalized URLs)
    const withSlash = `${normalized}/`;
    const [relayAlt] = await db.select().from(relays).where(eq(relays.url, withSlash)).limit(1);
    if (relayAlt) {
      return c.json({ success: true, data: { id: relayAlt.id, url: relayAlt.url } });
    }
    return c.json({ success: false, data: null });
  }
  return c.json({ success: true, data: { id: relay.id, url: relay.url } });
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
  process.stderr.write(`${err.stack ?? err.message ?? err}\n`);
  // Never expose internal error details to clients
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// ─── Start Server with Graceful Shutdown ───
const port = parseInt(process.env.PORT || '3001', 10);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

const shutdown = async () => {
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Monitor interval: min 10s to prevent abuse
const monitorInterval = Math.max(10_000, parseInt(process.env.MONITOR_INTERVAL_MS || '60000', 10));
startMonitor(monitorInterval);
