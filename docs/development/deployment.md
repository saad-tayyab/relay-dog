# 🚀 Deployment Guide

## Architecture Options

```
Option A: Single Server (Recommended)
┌─────────────────────────────────┐
│  VPS / Droplet                  │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Bun API  │  │ Vite Build   │ │
│  │ :3001    │  │ (static)     │ │
│  └────┬─────┘  └──────┬───────┘ │
│       │               │         │
│  ┌────┴───────────────┴──────┐  │
│  │  Nginx / Caddy            │  │
│  │  /api/* → :3001           │  │
│  │  /*      → static files   │  │
│  └───────────────────────────┘  │
│  ┌──────────┐                   │
│  │ Postgres │                   │
│  │ :5432    │                   │
│  └──────────┘                   │
└─────────────────────────────────┘

Option B: Cloud
┌──────────────┐    ┌──────────────┐
│  Vercel /    │    │  Neon /      │
│  Railway     │    │  Supabase    │
│  (API + Web) │    │  (Postgres)  │
└──────────────┘    └──────────────┘
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `API_KEY` | ✅ | — | Bearer token for mutating routes (server exits without it in production) |
| `PORT` | ❌ | `3001` | API server port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `CORS_ORIGINS` | ❌ | `localhost:5173,localhost:3000` | Comma-separated allowed origins |
| `POSTGRES_PASSWORD` | ✅ (Docker) | — | Postgres password for Docker compose |
| `MONITOR_INTERVAL_MS` | ❌ | `60000` | Background health check interval (ms, min 10000) |

### `.env` Example

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/relayscope
API_KEY=your-strong-random-api-key
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
POSTGRES_PASSWORD=change-me-in-production
MONITOR_INTERVAL_MS=300000
```

---

## Production Build

```bash
# 1. Install dependencies
bun install

# 2. Build all packages
bunx turbo build

# 3. Generate and run migrations
bun run db:generate
bun run db:migrate

# 4. Start the API server
cd apps/api
bun run start
```

### Frontend Build Output

The Svelte 5 frontend compiles to standard static assets (HTML, CSS, JS) in `apps/web/dist/`.
No server-side rendering — all rendering happens client-side via Vite's build output.

### What Gets Built

| Package | Output | Type |
|---------|--------|------|
| `@relayscope/web` | `apps/web/dist/` | Static HTML/CSS/JS |
| `@relayscope/api` | `apps/api/dist/` | Bundled JS (Bun target) |
| `@relayscope/shared` | (inlined) | Types only, no output |

---

## Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Phase 2+)
    location /ws/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Static files (web app)
    location / {
        root /path/to/relay-dog/apps/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

---

## Process Management

### PM2 (Recommended)

```bash
# Install PM2
bun add -g pm2

# Start API
cd apps/api
pm2 start dist/index.js --name relay-api --interpreter bun

# Auto-restart on crash
pm2 startup
pm2 save
```

### systemd

```ini
# /etc/systemd/system/relayscope.service
[Unit]
Description=Relay Scope API
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/relay-dog/apps/api
ExecStart=/usr/bin/bun run dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/relay-dog/.env

[Install]
WantedBy=multi-user.target
```

---

## Docker (Alternative)

```dockerfile
# Dockerfile
FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# Build
COPY . .
RUN bunx turbo build

# Production
FROM oven/bun:1.3.14-slim AS production
WORKDIR /app
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/package.json ./

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
```

---

## Docker Compose (PostgreSQL)

The included `docker-compose.yml` configures PostgreSQL with security hardening:

- **Localhost bind**: `127.0.0.1:5432` (not exposed to network)
- **Env password**: `${POSTGRES_PASSWORD}` from `.env` (required)
- **Healthcheck**: `pg_isready` with 10s interval
- **Resource limits**: 1 CPU, 512 MB RAM

```bash
# Start PostgreSQL
docker compose up -d

# Verify
docker compose exec postgres pg_isready -U postgres -d relayscope
```

---

## Health Checks

```bash
# API health
curl https://yourdomain.com/api/health
# → {"status":"ok","uptime":12345.67}

# NIP-11 check
curl -H "Accept: application/nostr+json" https://yourdomain.com/
```

---

## SSL / HTTPS

Use **Certbot** (Let's Encrypt) or **Caddy** (auto-HTTPS):

```bash
# Certbot
sudo certbot --nginx -d yourdomain.com

# Or Caddy (auto-HTTPS, no config needed)
yourdomain.com {
    reverse_proxy /api/* localhost:3001
    file_server /path/to/web/dist
}
```

---

## Deployment Checklist

> **Security:** See [Infrastructure Security Best Practices](infrastructure-security.md) and [Phase 10](../features/phase-10-infrastructure-hardening.md) for container hardening, supply chain, and CI/CD security requirements.

### Pre-Deploy

- [ ] PostgreSQL 18 running and accessible
- [ ] `.env` file with all required variables (`DATABASE_URL`, `API_KEY`, `POSTGRES_PASSWORD`)
- [ ] Strong `API_KEY` set (not the dev default)
- [ ] `CORS_ORIGINS` set to production domain(s)
- [ ] `NODE_ENV=production`
- [ ] Migrations run (`bun run db:migrate`)
- [ ] Production build succeeds (`bunx turbo build`)
- [ ] `.dockerignore` exists and excludes secrets

### Infrastructure

- [ ] API starts on correct port
- [ ] Nginx/Caddy configured
- [ ] SSL certificate active
- [ ] PM2/systemd process manager running
- [ ] Monitoring job enabled
- [ ] PostgreSQL bound to `127.0.0.1` only
- [ ] Data retention cron configured (health_checks 90d, events 30d, snapshots 180d)

---

*Last updated: v0.9.0 — 2026-07-01*
