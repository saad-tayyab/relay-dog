# 🚀 Phase 11: Production Deployment (Fly.io)

## Status

**Planned** 📋

## Overview

Deploy Relay Dog to production on Fly.io. Two separate Fly apps — API (Hono + Bun) and Web (Svelte static assets) — backed by Fly Postgres. This phase takes the app from "runs locally" to "live on the internet with a real domain."

> **Reference:** [Infrastructure Security Best Practices](../development/infrastructure-security.md) — container hardening and supply chain requirements must be satisfied before deploying.
> **Reference:** [Phase 10: Infrastructure Hardening](phase-10-infrastructure-hardening.md) — CIS benchmark compliance, `.dockerignore`, and health check DB verification are prerequisites.

## Already Shipped

| Item | Location | Status |
|------|----------|--------|
| Health check endpoint with DB verification | `apps/api/src/index.ts` | ✅ Done |
| Structured JSON logging | `apps/api/src/index.ts` | ✅ Done |
| Data retention cron | `apps/api/src/jobs/relayMonitor.ts` | ✅ Done |
| Graceful shutdown (SIGTERM/SIGINT) | `apps/api/src/index.ts` | ✅ Done |
| Security headers (HSTS, CSP) | `apps/api/src/index.ts` | ✅ Done |
| Docker resource limits + healthcheck | `docker-compose.yml` | ✅ Done |
| `.dockerignore` | `.dockerignore` | ✅ Done |
| DB connection pooling | `apps/api/src/db/index.ts` | ✅ Done |

## User Stories

1. **As an operator**, I want to deploy the API and web as separate Fly apps so they can scale independently.
2. **As an operator**, I want a production Dockerfile so Fly can build and run the API with Bun.
3. **As an operator**, I want Fly Postgres provisioned with backups so I don't lose data on volume failure.
4. **As a user**, I want the app served over HTTPS with a custom domain so I can access it securely.
5. **As an operator**, I want staging and production environments so I can test before promoting.
6. **As an operator**, I want secrets managed via `fly secrets` so credentials never appear in code or images.
7. **As an operator**, I want database migrations to run automatically on deploy so schema changes don't require manual intervention.

## Architecture

```
┌──────────────────────────────────────┐
│  Fly App: relay-dog-web              │
│  Static files (Svelte build output)  │
│  shared-cpu-1x, 256MB                │
│  Custom domain: relaydog.com         │
│  Auto-TLS via Fly                    │
└──────────────┬───────────────────────┘
               │ /api/* reverse proxy
┌──────────────▼───────────────────────┐
│  Fly App: relay-dog-api              │
│  Hono + Bun server                   │
│  shared-cpu-1x, 256MB                │
│  MONITOR_INTERVAL_MS=60000           │
│  NODE_ENV=production                 │
└──────────────┬───────────────────────┘
               │ SQL (internal Fly network)
┌──────────────▼───────────────────────┐
│  Fly Postgres                        │
│  shared-cpu-1x, 1GB storage          │
│  Auto-backup enabled                 │
│  Password from fly secrets           │
└──────────────────────────────────────┘
```

**Free tier allowance (3 shared VMs):**
- `relay-dog-web` — 1 VM (256MB)
- `relay-dog-api` — 1 VM (256MB)
- Fly Postgres — 1 VM (256MB), 1GB storage

All within the 3 VM / 3GB RAM free tier limit.

## Features

### 1. API Dockerfile

**New file:** `Dockerfile` (repo root)

Multi-stage build: install deps → build with Turbo → run with Bun.

```dockerfile
# Stage 1: Install and build
FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app

# Install deps first (layer caching)
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/env/package.json packages/config/env/
COPY packages/config/tsconfig/package.json packages/config/tsconfig/
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bunx turbo build --filter=@relayscope/api

# Stage 2: Production
FROM oven/bun:1.3.14-slim AS production
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy only what's needed
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

USER appuser
EXPOSE 3001

CMD ["bun", "run", "dist/index.js"]
```

### 2. Web Static Serving

The Svelte app builds to static HTML/CSS/JS (`apps/web/dist/`). Two options:

**Option A: Serve from API (simpler, 1 app)**
- Mount static files in Hono: `app.use('/*', serveStatic({ root: './apps/web/dist' }))`
- Single Fly app, single domain
- Downside: API and web scale together

**Option B: Separate Fly app (recommended)**
- Use Fly's static site feature or a lightweight static server
- Separate scaling, separate deployments
- Web app serves API requests via reverse proxy config

**Recommended: Option B** for separation of concerns.

**New file:** `apps/web/Dockerfile`

```dockerfile
FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/env/package.json packages/config/env/
COPY packages/config/tsconfig/package.json packages/config/tsconfig/
RUN bun install --frozen-lockfile

COPY . .
RUN bunx turbo build --filter=@relayscope/web

# Production: static files only
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback — all routes → index.html
RUN echo 'server { listen 80; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 3. Fly.io Configuration

**New file:** `fly.toml` (API app)

```toml
app = "relay-dog-api"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

**New file:** `apps/web/fly.toml` (Web app)

```toml
app = "relay-dog-web"
primary_region = "iad"

[build]

[http_service]
  internal_port = 80
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### 4. Secrets Management

All credentials via `fly secrets` — never in code, Dockerfiles, or images.

```bash
# API secrets
fly secrets set \
  DATABASE_URL="postgresql://postgres:PASSWORD@relay-dog-db.flycast:5432/relayscope" \
  API_KEY="$(openssl rand -hex 32)" \
  NODE_ENV="production" \
  CORS_ORIGINS="https://relaydog.com,https://www.relaydog.com" \
  MONITOR_INTERVAL_MS="60000" \
  --app relay-dog-api
```

**Required secrets:**

| Secret | Where | Notes |
|--------|-------|-------|
| `DATABASE_URL` | API | Connection string to Fly Postgres |
| `API_KEY` | API | Random 64-char hex, generated once |
| `NODE_ENV` | API | `production` |
| `CORS_ORIGINS` | API | Comma-separated production domains |
| `POSTGRES_PASSWORD` | Postgres | Set during provisioning |

### 5. Fly Postgres Provisioning

```bash
# Create Postgres app
fly postgres create \
  --name relay-dog-db \
  --region iad \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1

# Attach to API app (creates DATABASE_URL secret automatically)
fly postgres attach relay-dog-db --app relay-dog-api
```

**Backup strategy:**
- Fly Postgres includes automatic daily backups (7-day retention on free tier)
- For longer retention: weekly `pg_dump` to external storage

### 6. Custom Domain + TLS

```bash
# Add domain to web app
fly certs add relaydog.com --app relay-dog-web
fly certs add www.relaydog.com --app relay-dog-web

# Add domain to API app (if using separate API domain)
fly certs add api.relaydog.com --app relay-dog-api

# Check certificate status
fly certs list --app relay-dog-web
```

Fly auto-provisions Let's Encrypt certificates. DNS must point to Fly's nameservers or CNAME records.

### 7. Database Migration on Deploy

**New file:** `scripts/deploy.sh`

```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Deploying relay-dog..."

# 1. Run migrations on API
echo "📦 Running database migrations..."
fly ssh console -C "bun run db:migrate" --app relay-dog-api

# 2. Deploy API
echo "🔧 Deploying API..."
fly deploy --config fly.toml --app relay-dog-api

# 3. Deploy Web
echo "🌐 Deploying Web..."
fly deploy --config apps/web/fly.toml --app relay-dog-web

# 4. Verify health
echo "🏥 Checking health..."
sleep 5
STATUS=$(curl -sf https://relaydog.com/api/health | jq -r '.status')
if [ "$STATUS" = "ok" ]; then
  echo "✅ Deployment successful — API healthy"
else
  echo "❌ Deployment failed — API status: $STATUS"
  exit 1
fi
```

### 8. Staging Environment

Separate Fly apps for staging:

```bash
# Staging apps
fly apps create relay-dog-api-staging
fly apps create relay-dog-web-staging
fly postgres create --name relay-dog-db-staging

# Auto-deploy from main branch
# Manual promote to production
```

**Branch strategy:**
- `main` → auto-deploys to staging
- Manual `fly deploy` → promotes to production

### 9. Auto-Scaling Configuration

```toml
# In fly.toml
[http_service]
  auto_stop_machines = true    # Stop when no traffic (saves free tier VMs)
  auto_start_machines = true   # Start on incoming request
  min_machines_running = 0     # Allow full stop (free tier friendly)

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250           # Kill connections above this
    soft_limit = 200           # Start new machine above this
```

### 10. Production Checklist

**Pre-deploy:**
- [ ] `Dockerfile` builds successfully locally: `docker build -t relay-dog-api .`
- [ ] `.dockerignore` excludes secrets
- [ ] All GitHub Actions pinned to SHA (Phase 10)
- [ ] Health check returns 200 with DB connected
- [ ] Database migrations are up to date
- [ ] CORS_ORIGINS set to production domain
- [ ] API_KEY generated and set via `fly secrets`

**Post-deploy:**
- [ ] `curl https://relaydog.com/api/health` returns `{"status":"ok"}`
- [ ] `curl -H "Accept: application/nostr+json" https://relaydog.com/` returns NIP-11
- [ ] Web app loads at `https://relaydog.com`
- [ ] Add relay → health check → directory flow works end-to-end
- [ ] Monitor job is running (check logs: `fly logs --app relay-dog-api`)
- [ ] No errors in first 15 minutes: `fly logs --app relay-dog-api --since 15m`

**Ongoing:**
- [ ] Weekly: check `fly status --app relay-dog-api` for VM health
- [ ] Monthly: verify SSL certificates: `fly certs list --app relay-dog-web`
- [ ] Monthly: test database backup restore

## Files

| File | Change Type | Description |
|------|-------------|-------------|
| `Dockerfile` | **New** | Multi-stage API build (Bun) |
| `apps/web/Dockerfile` | **New** | Multi-stage web build (Nginx) |
| `fly.toml` | **New** | Fly.io API app config |
| `apps/web/fly.toml` | **New** | Fly.io web app config |
| `scripts/deploy.sh` | **New** | Deployment script with migration + health check |

## Effort

| Task | Estimated Time |
|------|---------------|
| API Dockerfile | 30 min |
| Web Dockerfile | 20 min |
| fly.toml configs | 20 min |
| Fly Postgres provisioning | 15 min |
| Secrets setup | 10 min |
| Custom domain + TLS | 10 min |
| Deploy script | 20 min |
| Staging environment | 20 min |
| End-to-end verification | 30 min |
| **Total** | **~3 hours** |
