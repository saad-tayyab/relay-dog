---
title: "🚀 Phase 11: Production Deployment"
version: "0.10.0"
status: "planned"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🚀 Phase 11: Production Deployment

> **v0.10.0** · **Planned** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


## Status

**Planned** 📋

## Overview

Deploy Relay Dog to production on an Oracle Cloud Always Free VM. Docker Compose runs the API (Hono + Bun), Web (Svelte/Nginx), and Postgres on a single VM with a public IP. This phase takes the app from "runs locally" to "live on the internet with a real domain."

**Why Oracle Cloud over Fly.io / Vercel / Render:**

| Requirement | Oracle Cloud | Fly.io | Vercel | Render |
|-------------|-------------|--------|--------|--------|
| Always-on (no spin-down) | ✅ | ⚠️ Free tier limits | ❌ Serverless | ❌ 15min spin-down |
| In-process cron (`setInterval`) | ✅ | ⚠️ | ❌ | ❌ |
| Postgres included | ✅ Self-hosted | ✅ Managed | ❌ External | ⚠️ 90-day trial |
| Turborepo monorepo | ✅ Full Docker | ✅ | ⚠️ Config needed | ⚠️ |
| Free forever | ✅ $0 | ⚠️ Free tier concerns | ✅ | ❌ DB expires |
| RAM | 24GB | 256MB | N/A | 512MB |
| Credit card required | ⚠️ Yes (verification) | No | No | No |

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

1. **As an operator**, I want to deploy the full stack on a single VM so I have full control and zero vendor lock-in.
2. **As an operator**, I want Docker Compose to manage all services so I can reproduce the stack identically across environments.
3. **As an operator**, I want automated database backups so I don't lose data on disk failure.
4. **As a user**, I want the app served over HTTPS with a custom domain so I can access it securely.
5. **As an operator**, I want staging and production environments so I can test before promoting.
6. **As an operator**, I want secrets managed via `.env` files so credentials never appear in code or images.
7. **As an operator**, I want database migrations to run automatically on deploy so schema changes don't require manual intervention.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Oracle Cloud Always Free VM                    │
│  ARM A1.Flex: 4 OCPUs, 24GB RAM                 │
│  Public IP: x.x.x.x                            │
│  Ubuntu 24.04                                   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Nginx (reverse proxy)                  │    │
│  │  Port 80/443 → TLS termination          │    │
│  │  relaydog.com → web (port 8080)         │    │
│  │  relaydog.com/api/* → api (port 3001)   │    │
│  └──────────┬──────────────────────────────┘    │
│             │                                   │
│  ┌──────────▼──────────┐  ┌──────────────────┐  │
│  │  relay-dog-web      │  │  relay-dog-api   │  │
│  │  Nginx (static)     │  │  Hono + Bun      │  │
│  │  Port 8080          │  │  Port 3001       │  │
│  │  Svelte build output│  │  Monitor cron    │  │
│  └─────────────────────┘  └────────┬─────────┘  │
│                                    │             │
│  ┌─────────────────────────────────▼──────────┐  │
│  │  Postgres 18 (Docker)                      │  │
│  │  Port 5432 (internal only)                 │  │
│  │  Volume: pgdata (persistent)               │  │
│  │  Daily backups via cron                    │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Resource allocation:**
- API: ~100MB RAM (Bun is lightweight)
- Web: ~10MB RAM (Nginx static)
- Postgres: ~200MB RAM (with 512MB limit)
- Nginx proxy: ~5MB RAM
- **Total: ~315MB of 24GB available** — room to grow

## Features

### 1. VM Setup (One-Time)

Provision an Oracle Cloud Always Free ARM instance:

1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free) (credit card required for verification — no charges for Always Free)
2. Create an ARM instance: **VM.Standard.A1.Flex** — 4 OCPUs, 24GB RAM
3. Choose **Ubuntu 24.04** as the image
4. Download the SSH key pair
5. SSH in: `ssh -i key.pem ubuntu@<PUBLIC_IP>`

Run the setup script on the VM:

**New file:** `scripts/setup-vm.sh`

```bash
#!/bin/bash
set -euo pipefail

echo "🖥️ Setting up Oracle Cloud VM for relay-dog..."

# System updates
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin (should come with Docker, but verify)
docker compose version

# Install certbot for SSL
sudo apt-get install -y certbot

# Install jq (for deploy script health checks)
sudo apt-get install -y jq

# Install git
sudo apt-get install -y git

# Create app directory
sudo mkdir -p /opt/relay-dog
sudo chown $USER:$USER /opt/relay-dog

# Create backup directory
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups

# Create daily backup cron job
cat > /tmp/relay-dog-backup << 'CRON'
0 3 * * * /opt/relay-dog/scripts/backup-db.sh >> /var/log/relay-dog-backup.log 2>&1
CRON
sudo crontab /tmp/relay-dog-backup
rm /tmp/relay-dog-backup

# Create log rotation for Docker container logs
# Docker stores container logs in /var/lib/docker/containers/
sudo tee /etc/logrotate.d/docker-containers > /dev/null << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
LOGROTATE

echo "✅ VM setup complete."
echo "   Next: clone the repo, create .env, and run docker compose up -d"
```

### 2. API Dockerfile

**New file:** `Dockerfile` (repo root)

Multi-stage build: install deps → build with Turbo → run with Bun.

> **Note:** Bun version (`1.3.14`) matches `packageManager` in `package.json`. When upgrading Bun, update both the Dockerfile and `package.json` together.

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

# Copy source and build with Turbo
COPY . .
RUN bunx turbo build --filter=@relayscope/api

# Stage 2: Production
FROM oven/bun:1.3.14-slim AS production
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy only what's needed — Bun bundles all imports into dist/index.js,
# so no node_modules required at runtime
COPY --from=builder /app/apps/api/dist ./dist

# Health check (for local docker run and Docker Compose health checks)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

USER appuser
EXPOSE 3001

CMD ["bun", "run", "dist/index.js"]
```

### 3. Web Static Serving

**New file:** `apps/web/Dockerfile`

```dockerfile
# Stage 1: Build Svelte app
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

# Stage 2: Static files only
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback — all routes → index.html
# The try_files directive ensures client-side routing works: any path
# that doesn't match a static file falls back to index.html, letting
# the Svelte SPA handle routing.
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # Cache static assets\n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 4. Production Docker Compose

**Updated file:** `docker-compose.yml` (replaces existing dev-only compose)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: relay-dog-api
    ports:
      - "127.0.0.1:3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/relayscope
      API_KEY: ${API_KEY}
      NODE_ENV: production
      CORS_ORIGINS: ${CORS_ORIGINS:-https://relaydog.com,https://www.relaydog.com}
      MONITOR_INTERVAL_MS: ${MONITOR_INTERVAL_MS:-60000}
      PORT: 3001
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - SETUID
      - SETGID
    read_only: true
    tmpfs:
      - /tmp
    networks:
      - internal

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: relay-dog-web
    ports:
      - "127.0.0.1:8080:80"
    depends_on:
      - api
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 64M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run
    networks:
      - internal

  db:
    image: postgres:18-alpine
    container_name: relay-dog-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
      POSTGRES_DB: relayscope
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d relayscope']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
      - FOWNER
      - DAC_READ_SEARCH
    tmpfs:
      - /tmp
      - /run/postgresql
    networks:
      - internal

volumes:
  pgdata:

networks:
  internal:
    driver: bridge
```

> **Key design decisions:**
> - All ports bind to `127.0.0.1` — only accessible via Nginx reverse proxy, not directly from the internet
> - `read_only: true` on API and web containers — prevents runtime file writes
> - `cap_drop: ALL` with minimal `cap_add` — follows CIS Docker Benchmark
> - `no-new-privileges` — prevents privilege escalation
> - Dedicated `internal` network — containers can't be reached from outside

### 5. Nginx Reverse Proxy + SSL

**New file:** `nginx/nginx.conf`

```nginx
# Rate limiting zone (http level)
limit_req_zone $binary_remote_addr zone=api_read:10m rate=200r/m;

# Upstream definitions — use Docker service names, not 127.0.0.1
# (127.0.0.1 inside a container is the container's own loopback,
#  not the host or other containers)
upstream api {
    server api:3001;
}

upstream web {
    server web:80;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name relaydog.com www.relaydog.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name relaydog.com www.relaydog.com;

    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/relaydog.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relaydog.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes — rate limit applied at Nginx level
    # Note: The API also has its own rate limiting via hono-rate-limiter
    # (20 writes/min, 200 reads/min per IP). Nginx rate limiting is an
    # additional defense layer.
    location /api/ {
        limit_req zone=api_read burst=50 nodelay;

        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;

        # Request size limit (matches bodyLimit in Hono)
        client_max_body_size 100k;
    }

    # NIP-11 (Nostr relay info) — Accept: application/nostr+json
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static asset caching (Svelte build output)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://web;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**SSL certificate provisioning (run on the VM host, not inside Docker):**

```bash
# Create webroot for ACME challenges
sudo mkdir -p /var/www/certbot

# Get initial certificate — DNS must point to VM's public IP first
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d relaydog.com \
  -d www.relaydog.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# Auto-renewal (certbot installs a systemd timer by default)
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

**Add Nginx to docker-compose.yml:**

```yaml
  nginx:
    image: nginx:alpine
    container_name: relay-dog-nginx
    ports:
      - "80:80"      # HTTP + ACME challenges (must be 0.0.0.0 for external access)
      - "443:443"    # HTTPS (must be 0.0.0.0 for external access)
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /var/www/certbot:/var/www/certbot:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api
      - web
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 64M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - SETUID
      - SETGID
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run
    networks:
      - internal
```

### 6. Secrets Management

All credentials live in a `.env` file on the VM — never in code, Dockerfiles, or images.

**New file:** `.env.example`

```bash
# Database
POSTGRES_PASSWORD=CHANGE_ME_TO_A_STRONG_PASSWORD

# API
API_KEY=CHANGE_ME_TO_RANDOM_HEX_64_CHARS
NODE_ENV=production
CORS_ORIGINS=https://relaydog.com,https://www.relaydog.com
MONITOR_INTERVAL_MS=60000
```

**Generate secrets:**

```bash
# Generate a strong Postgres password
openssl rand -base64 32

# Generate a 64-char hex API key
openssl rand -hex 32
```

**On the VM:**

```bash
cd /opt/relay-dog
cp .env.example .env
nano .env  # Fill in real values
chmod 600 .env  # Restrict permissions — only owner can read
```

> **Security:** The `.env` file is excluded from git via `.dockerignore` and `.gitignore`. Set `chmod 600` so only the deploy user can read it. Never commit `.env` to source control.

**Required variables:**

| Variable | Where | Notes |
|----------|-------|-------|
| `POSTGRES_PASSWORD` | DB + API | Random 32+ chars, generated once |
| `API_KEY` | API | Random 64-char hex, generated once |
| `NODE_ENV` | API | `production` |
| `CORS_ORIGINS` | API | Comma-separated production domains |
| `MONITOR_INTERVAL_MS` | API | `60000` (1 minute) |

> **Note:** `DATABASE_URL` is composed in `docker-compose.yml` from `POSTGRES_PASSWORD`. The `postgres` library accepts both `postgresql://` and `postgres://` schemes. The connection string format is: `postgresql://postgres:PASSWORD@db:5432/relayscope` where `db` is the Docker service name.

### 7. Release Process

> **Reference:** [Deployment Guide](../development/deployment.md#release-process) — the operational reference for version management, migration safety rules, and rollback procedures.

Every release follows this sequence: **branch → migrate → test → tag → deploy**.

#### 7a. Version Management

Versions follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| New feature, non-breaking | MINOR | 0.8.0 → 0.9.0 |
| Bug fix, no schema change | PATCH | 0.9.0 → 0.9.1 |
| Breaking schema change, column drop | MAJOR | 0.9.1 → 1.0.0 |

Version lives in `apps/api/package.json` and `apps/web/package.json` (both at `0.8.0` today). Bump both together.

#### 7b. Migration Safety Rules

Drizzle migrations are **forward-only** — there's no built-in rollback. A bad migration can destroy data. Follow these rules:

**Safe migrations (can deploy anytime):**
- `ALTER TABLE ... ADD COLUMN` (nullable or with default)
- `CREATE TABLE`
- `CREATE INDEX`
- `ALTER COLUMN ... SET DEFAULT`
- `ALTER COLUMN ... DROP NOT NULL`

**Dangerous migrations (require careful sequencing):**
- `ALTER TABLE ... DROP COLUMN` — must be done in a **two-release cycle**:
  1. Release 1: Stop using the column in code (deploy, verify)
  2. Release 2: Drop the column (deploy, verify)
- `ALTER TABLE ... RENAME COLUMN` — same two-release pattern
- `ALTER TABLE ... DROP TABLE` — ensure no code references it
- `UPDATE ... SET column = value` on large tables — can lock the table

**The golden rule:** The old code version must work with the new schema. If you can't roll back the code without breaking the database, the migration is too aggressive.

#### 7c. Pre-Deploy Checklist (Run Locally)

```bash
# 1. Ensure you're on a clean working tree
git status  # Should be clean

# 2. Run type-check and lint
bun run type-check
bun run lint

# 3. Run tests
bun run test  # if tests exist

# 4. Verify migrations generate cleanly
cd apps/api
bun run db:generate  # Generates migration SQL
# Review the generated SQL in drizzle/ before committing

# 5. Test the Docker build locally
docker compose build --no-cache api
docker compose build --no-cache web

# 6. Test locally with Docker Compose
docker compose up -d
sleep 5
curl -sf http://localhost:3001/api/health | jq .
curl -sf http://localhost:8080/ | head -5
docker compose down
```

#### 7d. Deploy Script

**Updated file:** `scripts/deploy.sh`

```bash
#!/bin/bash
set -euo pipefail

REMOTE_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST}"
REMOTE_USER="${DEPLOY_USER:-ubuntu}"
REMOTE_DIR="/opt/relay-dog"
BACKUP_DIR="/opt/backups/relay-dog"

echo "🚀 Deploying relay-dog to ${REMOTE_HOST}..."

# ─── Step 1: Push local changes ───
echo "📦 Pushing code..."
git push origin main

# ─── Step 2: SSH and deploy ───
echo "🔧 Deploying on VM..."
ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << DEPLOY
set -euo pipefail
cd ${REMOTE_DIR}

# ─── 2a: Backup database (always, before any change) ───
echo "💾 Backing up database..."
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
mkdir -p ${BACKUP_DIR}
docker compose exec -T db pg_dump -U postgres relayscope | gzip > ${BACKUP_DIR}/pre-deploy_\${TIMESTAMP}.sql.gz
echo "   Backup: pre-deploy_\${TIMESTAMP}.sql.gz"

# ─── 2b: Pull latest code ───
echo "📦 Pulling latest code..."
PREVIOUS_COMMIT=\$(git rev-parse HEAD)
git pull origin main
NEW_COMMIT=\$(git rev-parse HEAD)
echo "   Previous: \$PREVIOUS_COMMIT"
echo "   New:      \$NEW_COMMIT"

if [ "\$PREVIOUS_COMMIT" = "\$NEW_COMMIT" ]; then
  echo "⚠️  No new commits — nothing to deploy"
  exit 0
fi

# ─── 2c: Build new images (old containers keep running during build) ───
echo "🔨 Building new images..."
docker compose build --no-cache

# ─── 2d: Swap containers (minimal downtime) ───
echo "🔄 Swapping containers..."
docker compose up -d --remove-orphans

# ─── 2e: Wait for DB to be healthy ───
echo "⏳ Waiting for database..."
sleep 5

# ─── 2f: Run migrations ───
echo "📦 Running database migrations..."
docker compose exec -T api bun run db:migrate

# ─── 2g: Verify health ───
echo "🏥 Checking health..."
sleep 3
STATUS=\$(curl -sf http://localhost:3001/api/health | jq -r '.status')
if [ "\$STATUS" = "ok" ]; then
  echo "✅ Deployment successful — API healthy"
  echo "   Version: \$(docker compose exec -T api cat dist/index.js | head -1 || echo 'unknown')"
else
  echo "❌ Deployment failed — API status: \$STATUS"
  echo ""
  echo "🔄 Rolling back to \$PREVIOUS_COMMIT..."
  git checkout \$PREVIOUS_COMMIT
  docker compose build --no-cache
  docker compose up -d --remove-orphans
  echo "⚠️  Code rolled back. If migration ran, database may need manual restore:"
  echo "   gunzip < ${BACKUP_DIR}/pre-deploy_\${TIMESTAMP}.sql.gz | docker compose exec -T db psql -U postgres relayscope"
  exit 1
fi

# ─── 2h: Clean up old images ───
docker image prune -f
DEPLOY

echo "✅ Deploy complete"
```

#### 7e. Rollback Procedure

**Code rollback (no data loss):**

```bash
# From your local machine
export DEPLOY_HOST=x.x.x.x
export DEPLOY_USER=ubuntu

ssh ${DEPLOY_USER}@${DEPLOY_HOST} << 'ROLLBACK'
cd /opt/relay-dog

# Find the last good release
git log --oneline -10
git tag -l  # List tagged releases

# Rollback to a specific tag
git checkout v0.8.0  # or any previous tag/commit
docker compose build --no-cache
docker compose up -d --remove-orphans

# Verify
curl -sf http://localhost:3001/api/health | jq .
ROLLBACK
```

**Code + database rollback (destructive migration):**

```bash
ssh ${DEPLOY_USER}@${DEPLOY_HOST} << 'ROLLBACK'
cd /opt/relay-dog

# 1. Find the pre-deploy backup
ls -la /opt/backups/relay-dog/pre-deploy_*.sql.gz

# 2. Rollback code
git checkout v0.8.0
docker compose build --no-cache
docker compose up -d --remove-orphans

# 3. Restore database
gunzip < /opt/backups/relay-dog/pre-deploy_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U postgres relayscope

# 4. Verify
curl -sf http://localhost:3001/api/health | jq .
ROLLBACK
```

> **Important:** Only restore the database if the migration was destructive. If you just need to revert code, the old code will work fine with the new schema (as long as you followed the migration safety rules above).

### 8. Database Backup

**New file:** `scripts/backup-db.sh`

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/relay-dog"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/relayscope_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump and compress
docker compose exec -T db pg_dump -U postgres relayscope | gzip > "$BACKUP_FILE"

# Keep only last 7 daily backups
ls -t "$BACKUP_DIR"/relayscope_*.sql.gz | tail -n +8 | xargs -r rm

echo "$(date -Iseconds) Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
```

**Restore:**

```bash
gunzip < /opt/backups/relay-dog/relayscope_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U postgres relayscope
```

### 9. Staging Environment

Run staging on the same VM with different ports and a separate database.

**New file:** `docker-compose.staging.yml`

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: relay-dog-api-staging
    ports:
      - "127.0.0.1:3011:3001"
    environment:
      DATABASE_URL: postgresql://postgres:${STAGING_POSTGRES_PASSWORD}@db-staging:5432/relayscope
      API_KEY: ${STAGING_API_KEY}
      NODE_ENV: production
      CORS_ORIGINS: ${STAGING_CORS_ORIGINS:-http://localhost:3011}
      MONITOR_INTERVAL_MS: ${MONITOR_INTERVAL_MS:-60000}
      PORT: 3001
    depends_on:
      db-staging:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    networks:
      - staging

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: relay-dog-web-staging
    ports:
      - "127.0.0.1:3080:80"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - staging

  db-staging:
    image: postgres:18-alpine
    container_name: relay-dog-db-staging
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${STAGING_POSTGRES_PASSWORD:?Set STAGING_POSTGRES_PASSWORD}
      POSTGRES_DB: relayscope
    volumes:
      - pgdata-staging:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d relayscope']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - staging

volumes:
  pgdata-staging:

networks:
  staging:
    driver: bridge
```

**Deploy staging:**

```bash
docker compose -f docker-compose.staging.yml up -d --build
docker compose -f docker-compose.staging.yml exec -T api bun run db:migrate
```

**Branch strategy:**
- `main` → SSH + `./scripts/deploy.sh` → production
- `develop` → SSH + `docker compose -f docker-compose.staging.yml up -d` → staging
- Test on staging, then merge to `main` for production

### 10. Monitoring

```bash
# Real-time logs (all services)
docker compose logs -f

# API logs only
docker compose logs -f api

# Recent errors
docker compose logs --since 1h api 2>&1 | grep '"level":"error"'

# Container resource usage
docker stats --no-stream

# Disk usage
docker system df

# Database size
docker compose exec db psql -U postgres -c \
  "SELECT pg_size_pretty(pg_database_size('relayscope'));"
```

The API's structured JSON logs (Phase 10) include `timestamp`, `level`, and `msg` fields. Filter with `jq`:

```bash
docker compose logs api 2>&1 | jq 'select(.level == "error")'
```

**Uptime monitoring (optional, free):**

Set up a free external monitor to alert you if the site goes down:

- [healthchecks.io](https://healthchecks.io) — 20 checks free, ping from cron
- [cronitor.io](https://cronitor.io) — 5 monitors free
- [UptimeRobot](https://uptimerobot.com) — 50 monitors free

Point them at `https://relaydog.com/api/health`.

### 11. Rollback Procedure

See **Section 7e** for the full rollback procedure with commands.

**Quick reference:**

| Scenario | Action |
|----------|--------|
| Code has a bug, no migration ran | `git checkout <prev-tag>` → rebuild → restart |
| Code has a bug, migration ran (non-destructive) | `git checkout <prev-tag>` → rebuild → restart (schema is backward-compatible) |
| Migration was destructive (column drop, data loss) | `git checkout <prev-tag>` → rebuild → restart → **restore database from pre-deploy backup** |
| Entire deploy failed (health check never passed) | Deploy script auto-rollbacks code. Restore DB manually if needed |

> **Key insight:** If you follow the migration safety rules (Section 7b), you should **never** need to restore the database. Old code always works with new schema. Database restore is a last resort.

### 12. Security Hardening

**VM-level (run once on setup):**

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# SSH hardening — disable password auth, disable root login
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Docker-level (already in compose):**

| Control | Implementation |
|---------|---------------|
| Non-root user | `USER appuser` in API Dockerfile |
| Read-only filesystem | `read_only: true` in compose |
| No new privileges | `security_opt: no-new-privileges:true` |
| Minimal capabilities | `cap_drop: ALL` + only required caps |
| Resource limits | `deploy.resources.limits` per container |
| Internal network | Containers only reachable via Nginx |
| No exposed ports | All ports bind to `127.0.0.1` |
| `.dockerignore` | Excludes `.env`, `node_modules`, `.git` |

### 13. Production Checklist

**Pre-deploy:**
- [ ] VM provisioned with Ubuntu 24.04, Docker installed
- [ ] SSH key-based auth configured (password auth disabled)
- [ ] UFW firewall enabled (ports 22, 80, 443 only)
- [ ] Domain DNS pointing to VM public IP
- [ ] `.env` file created with strong secrets (`chmod 600`)
- [ ] `.dockerignore` excludes secrets
- [ ] All GitHub Actions pinned to SHA (Phase 10)
- [ ] Health check returns 200 with DB connected
- [ ] Database migrations are up to date
- [ ] `Dockerfile` builds successfully: `docker build -t relay-dog-api .`

**Post-deploy:**
- [ ] `curl https://relaydog.com/api/health` returns `{"status":"ok"}`
- [ ] `curl https://relaydog.com/` returns `{"name":"Relay Scope API","status":"running",...}`
- [ ] Web app loads at `https://relaydog.com`
- [ ] Add relay → health check → directory flow works end-to-end
- [ ] Monitor job is running: `docker compose logs api | grep "monitor"`
- [ ] No errors in first 15 minutes: `docker compose logs --since 15m api`
- [ ] SSL certificate valid: `curl -vI https://relaydog.com 2>&1 | grep "SSL certificate"`
- [ ] Certbot auto-renewal configured: `sudo systemctl status certbot.timer`

**Ongoing:**
- [ ] Weekly: `docker compose ps` — all containers healthy
- [ ] Weekly: `docker system prune -f` — clean unused images
- [ ] Weekly: check backup exists: `ls -la /opt/backups/relay-dog/`
- [ ] Monthly: `docker compose exec db psql -U postgres -c "SELECT pg_database_size('relayscope');"`
- [ ] Monthly: verify SSL certificates not expiring soon: `sudo certbot certificates`
- [ ] Monthly: test database backup restore on staging
- [ ] Quarterly: update base images: `docker compose pull && docker compose up -d`

## Files

| File | Change Type | Description |
|------|-------------|-------------|
| `Dockerfile` | **New** | Multi-stage API build (Bun + Turbo) |
| `apps/web/Dockerfile` | **New** | Multi-stage web build (Nginx) |
| `docker-compose.yml` | **Updated** | Production services (API + Web + Postgres + Nginx) |
| `docker-compose.staging.yml` | **New** | Staging environment (separate DB, different ports) |
| `nginx/nginx.conf` | **New** | Reverse proxy + SSL + rate limiting |
| `.env.example` | **New** | Required environment variables |
| `scripts/setup-vm.sh` | **New** | One-time VM setup |
| `scripts/deploy.sh` | **Updated** | SSH-based deployment with backup + migration + rollback |
| `scripts/backup-db.sh` | **New** | Daily Postgres backup with rotation |

## Effort

| Task | Estimated Time |
|------|---------------|
| VM provisioning + setup | 30 min |
| API Dockerfile | Already done |
| Web Dockerfile | Already done |
| Docker Compose (production) | 20 min |
| Nginx reverse proxy + SSL | 30 min |
| Secrets setup (.env) | 10 min |
| Deploy script | 15 min |
| Backup script | 10 min |
| Staging environment | 20 min |
| Security hardening (UFW, SSH) | 15 min |
| End-to-end verification | 30 min |
| **Total** | **~3 hours** |
