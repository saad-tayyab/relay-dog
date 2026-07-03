# 🔐 Environment Variables

All configuration via environment variables. No secrets in code.

## Variables

### Required (Production)

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/relayscope` | PostgreSQL connection string |
| `API_KEY` | `your-strong-random-api-key` | Bearer token for mutating API routes. Server exits without it in production. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://localhost:5432/relayscope` | PostgreSQL connection string in development |
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed CORS origins |
| `POSTGRES_PASSWORD` | `postgres` | Postgres password for env parsing; Docker compose still requires this in `.env` |
| `MONITOR_INTERVAL_MS` | `60000` | Background health check interval (ms). Minimum 10000. |

## Setup

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

### `.env` (Development)

```bash
DATABASE_URL=postgresql://localhost:5432/relayscope
PORT=3001
NODE_ENV=development
API_KEY=dev-api-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MONITOR_INTERVAL_MS=60000
```

### `.env` (Production)

```bash
DATABASE_URL=postgresql://user:password@db-host:5432/relayscope
PORT=3001
NODE_ENV=production
API_KEY=<strong-random-key>
CORS_ORIGINS=https://yourdomain.com
POSTGRES_PASSWORD=<strong-password>
MONITOR_INTERVAL_MS=300000
```

## Security Rules

- **Never** commit `.env` (it's gitignored)
- **Never** log `DATABASE_URL` (contains password)
- **Use** `.env.example` as documentation (no real values)
- **Rotate** database passwords if accidentally exposed
- **Set a strong `API_KEY`** — this is the only protection on mutating endpoints
- **Leave `API_KEY` unset only for local development** if you intentionally want unprotected write endpoints
- **Set `POSTGRES_PASSWORD`** — Docker compose requires it; never use default `postgres`

---

*Last updated: v0.9.0 — 2026-07-01*
