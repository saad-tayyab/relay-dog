# ⚡ API Overview

The API server is a **Hono** application running on **Bun**, providing a REST API for the Relay Scope web app.

## Architecture

```
apps/api/
├── src/
│   ├── index.ts              # Hono app, middleware, security headers, server startup
│   ├── routes/
│   │   ├── relays.ts         # Relay CRUD + health check endpoints
│   │   ├── directory.ts      # Directory browse, filter, compare
│   │   ├── discover.ts       # NIP-66 discovery observations
│   │   └── popularity.ts     # NIP-65 relay list entries
│   ├── jobs/
│   │   └── relayMonitor.ts   # Background monitoring scheduler
│   ├── lib/
│   │   ├── schemas.ts        # Zod input validation schemas
│   │   ├── ssrf.ts           # SSRF URL safety validator
│   │   └── errors.ts         # Error categorization for health checks
│   ├── middleware/
│   │   └── auth.ts           # Bearer token authentication
│   └── db/
│       ├── index.ts           # Drizzle + postgres.js connection
│       └── schema.ts          # Table definitions (7 tables)
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry point — mounts routes, security headers, rate limiting, monitor |
| `src/routes/relays.ts` | Relay CRUD, health check, history, NIP-11 history |
| `src/routes/directory.ts` | Directory browse, country list, comparison |
| `src/routes/discover.ts` | NIP-66 monitor discovery observations |
| `src/routes/popularity.ts` | NIP-65 relay list entries |
| `src/middleware/auth.ts` | Bearer token auth on mutating routes |
| `src/lib/ssrf.ts` | URL safety validator — blocks private/loopback/cloud metadata |
| `src/lib/schemas.ts` | Zod schemas for relay create/update, discovery, popularity |
| `src/lib/errors.ts` | Categorizes health check errors into typed strings |
| `src/jobs/relayMonitor.ts` | Background health check scheduler |
| `src/db/schema.ts` | Drizzle schema (7 tables) |
| `src/db/index.ts` | Database connection |

## Running

```bash
# Development (with watch mode)
cd apps/api
bun run dev

# Production build
bun run build
bun run start
```

## Middleware

| Middleware | Purpose |
|------------|---------|
| `cors` | Allow cross-origin requests from web app (configurable via `CORS_ORIGINS`) |
| `logger` | Request/response logging (dev only) |
| `rateLimiter` | IP-based rate limiting (20 write / 200 read per min) |
| `bodyLimit` | Request body capped at 100 KB |
| `auth` | Bearer token authentication on mutating routes |
| Security Headers | `X-Content-Type-Options`, `Referrer-Policy`, `CSP`, `Permissions-Policy`, `HSTS` (production) |

## Security

- **API key auth** on `POST`, `PUT`, `DELETE` routes (`requireApiKey` middleware)
- **SSRF protection** — all server-side URL fetches validated against private/loopback ranges
- **Rate limiting** — per-IP, separate limits for read and write operations
- **Zod validation** — strict input schemas on create/update endpoints
- **Mass assignment prevention** — PUT only allows whitelisted fields
- **Production error handler** — generic error messages, full details logged server-side only
- **Body size limit** — 100 KB max request body

## Environment Variables

| Variable | Required (prod) | Default | Description |
|----------|-----------------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `API_KEY` | ✅ | — | Bearer token for mutating API routes |
| `PORT` | ❌ | `3001` | Server port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `CORS_ORIGINS` | ❌ | `localhost:5173,localhost:3000` | Comma-separated allowed origins |
| `POSTGRES_PASSWORD` | ✅ (Docker) | — | Postgres password for Docker |
| `MONITOR_INTERVAL_MS` | ❌ | `60000` | Background health check interval (ms, min 10000) |

---

*Full endpoint documentation: [API Endpoints](endpoints.md)*

---

*Last updated: v0.9.0 — 2026-07-01*
