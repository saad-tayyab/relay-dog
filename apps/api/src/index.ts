import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { rateLimiter } from 'hono-rate-limiter';
import { startMonitor } from './jobs/relayMonitor';
import directoryRoutes from './routes/directory';
import relayRoutes from './routes/relays';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.API_KEY) {
  process.stderr.write('API_KEY is required in production\n');
  process.exit(1);
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

// ─── Security Headers ───
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
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

app.route('/api/relays', relayRoutes);
app.route('/api/directory', directoryRoutes);

// ─── 404 Handler ───
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// ─── Error Handler ───
app.onError((err, c) => {
  process.stderr.write(`${err.stack ?? err.message ?? err}\n`);
  const message = isProduction ? 'Internal server error' : err.message || 'Internal server error';
  return c.json({ success: false, error: message }, 500);
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

const monitorInterval = parseInt(process.env.MONITOR_INTERVAL_MS || '60000', 10);
startMonitor(monitorInterval);
