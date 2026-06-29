# 🔐 Environment Variables

All configuration via environment variables. No secrets in code.

## Variables

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/relayscope` | PostgreSQL connection string |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `MONITOR_INTERVAL_MS` | `60000` | Background health check interval (ms) |

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
MONITOR_INTERVAL_MS=60000
```

### `.env` (Production)

```bash
DATABASE_URL=postgresql://user:password@db-host:5432/relayscope
PORT=3001
NODE_ENV=production
MONITOR_INTERVAL_MS=300000
```

## Security Rules

- **Never** commit `.env` (it's gitignored)
- **Never** log `DATABASE_URL` (contains password)
- **Use** `.env.example` as documentation (no real values)
- **Rotate** database passwords if accidentally exposed
