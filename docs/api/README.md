# ⚡ API Overview

The API server is a **Hono** application running on **Bun**, providing a REST API for the Relay Scope web app.

## Architecture

```
apps/api/
├── src/
│   ├── index.ts              # Hono app, middleware, server startup
│   ├── routes/
│   │   └── relays.ts         # Relay CRUD + health check endpoints
│   ├── jobs/
│   │   └── relayMonitor.ts   # Background monitoring scheduler
│   └── db/
│       ├── index.ts           # Drizzle + postgres.js connection
│       └── schema.ts          # Table definitions
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry point — mounts routes, starts monitor |
| `src/routes/relays.ts` | All relay endpoints (319 lines) |
| `src/jobs/relayMonitor.ts` | Background health check scheduler |
| `src/db/schema.ts` | Drizzle schema (5 tables) |
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
| `cors` | Allow cross-origin requests from web app |
| `logger` | Request/response logging |
| `prettyJSON` | Formatted JSON output |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `postgresql://localhost:5432/relayscope` | PostgreSQL connection string |

---

*Full endpoint documentation: [API Endpoints](endpoints.md)*
