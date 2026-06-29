import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { startMonitor } from './jobs/relayMonitor';
import relayRoutes from './routes/relays';

const app = new Hono();

// ─── Middleware ───
app.use('*', logger());

// CORS — origins from env, fallback to dev defaults
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use('/api/*', prettyJSON());

// ─── Security Headers ───
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ─── Routes ───

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'Relay Scope API',
    version: '0.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// API health
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() });
});

// Relay routes
app.route('/api/relays', relayRoutes);

// ─── 404 Handler ───
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// ─── Error Handler ───
app.onError((err, c) => {
  return c.json({ success: false, error: err.message || 'Internal server error' }, 500);
});

// ─── Start Server with Graceful Shutdown ───
const port = parseInt(process.env.PORT || '3001', 10);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
const shutdown = async () => {
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the monitoring job after server is up
startMonitor(60_000); // Check relays every 60 seconds

export default app;
