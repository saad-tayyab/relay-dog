import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { startMonitor } from './jobs/relayMonitor';
import relayRoutes from './routes/relays';

const app = new Hono();

// ─── Middleware ───
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use('/api/*', prettyJSON());

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

// ─── Start Server ───
const port = parseInt(process.env.PORT || '3001', 10);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ API running at http://localhost:${server.port}`);

// Start the monitoring job after server is up
startMonitor(60_000); // Check relays every 60 seconds

export default app;
