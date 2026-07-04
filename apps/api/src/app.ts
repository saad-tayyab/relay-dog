import { db } from '@relayscope/database';
import { getServerEnv } from '@relayscope/env/server';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';
import { log } from './lib/log';
import directoryRoutes from './routes/directory';
import relayRoutes from './routes/relay';

const env = getServerEnv();
const isProduction = env.NODE_ENV === 'production';

export function createApp() {
  const app = new Hono();

  function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
    return (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'
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
  app.use('/api/*', bodyLimit({ maxSize: 100 * 1024 }));

  // ─── Security Headers (Hono built-in + custom CSP) ───
  app.use(
    '*',
    secureHeaders({
      // Override defaults — handle CSP separately for API responses
      contentSecurityPolicy: false,
      xFrameOptions: false,
      strictTransportSecurity: isProduction
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  app.use('*', async (c, next) => {
    await next();
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
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
  app.route('/api/directory', directoryRoutes);

  // ─── 404 Handler ───
  app.notFound((c) => {
    return c.json({ success: false, error: 'Not found' }, 404);
  });

  // ─── Error Handler ───
  app.onError((err, c) => {
    log({ level: 'error', msg: 'Request error', error: err.stack ?? err.message ?? String(err) });
    return c.json({ success: false, error: 'Internal server error' }, 500);
  });

  return app;
}
