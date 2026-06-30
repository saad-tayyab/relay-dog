# 🛡️ Infrastructure Security Best Practices

## Overview

> **Implementation:** See [Phase 10: Infrastructure Hardening](../features/phase-10-infrastructure-hardening.md) for the specific code changes that implemented these standards.

Production-grade infrastructure for Relay Dog must satisfy three non-negotiable properties:

1. **No secrets in source** — credentials exist only in runtime env, never in code or images
2. **Least privilege everywhere** — every process, container, CI job, and IAM role gets only what it needs
3. **Defense in depth** — no single layer (network, container, app) is the only line of defense

This document codifies the standards we follow, drawn from NIST SP 800-204D, CIS Benchmarks, and CISA SCuBA. It is the reference for all infrastructure code (Docker, CI/CD, deployment).

---

## 1. Secrets Management

### Rules

| Rule | Rationale |
|------|-----------|
| **Never commit `.env` files** | Git history is permanent — even deleted files persist |
| **Only `.env.example` in repo** | Documents required vars without real values |
| **Use platform secrets for CI** | GitHub Actions secrets, Fly.io `fly secrets` |
| **Rotate on exposure** | If a secret leaks, rotate immediately and purge git history |
| **No secrets in Docker layers** | `COPY . .` can include `.env` — use `.dockerignore` |

### `.dockerignore` (Required)

```
.git
.env
.env.*
!.env.example
node_modules
.turbo
dist
build
coverage
*.log
.DS_Store
```

### Dockerfile Anti-Pattern

```dockerfile
# ❌ NEVER — copies everything including .env
COPY . .

# ✅ ONLY copy what's needed
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/env/package.json packages/config/env/
```

---

## 2. GitHub Actions Security

### Pin Actions to Full SHA

Tags (`v4`, `v2`) are **mutable** — the upstream repo can force-push new code to the same tag. This is a supply chain attack vector.

```yaml
# ❌ Mutable tag — upstream can change what runs
- uses: actions/checkout@v4
- uses: oven-sh/setup-bun@v2

# ✅ Pinned to immutable commit hash
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
- uses: oven-sh/setup-bun@a1800f14c238f7d61c634695d4518528d3f88c09  # v2.0.1
```

### Restrict Workflow Permissions

Default permissions may be broader than needed. Always set explicit permissions.

```yaml
# ✅ Minimal permissions — read-only
permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps: ...
```

### Verify External Downloads

Never download binaries from `latest` without checksum verification.

```yaml
# ❌ Unpinned, no checksum
curl -fsSL https://github.com/tool/releases/latest/download/tool -o tool

# ✅ Pinned version with SHA256 verification
curl -fsSL https://github.com/tool/releases/download/v1.2.3/tool -o tool
echo "abc123...  tool" | sha256sum -c -
```

### Never Suppress Security Failures

```yaml
# ❌ Vulnerabilities silently ignored
- run: bun audit
  continue-on-error: true

# ✅ Fail the pipeline on vulnerabilities
- run: bun audit
```

---

## 3. Docker Container Hardening

### CIS Docker Benchmark Requirements

| Benchmark | Requirement | Implementation |
|-----------|-------------|----------------|
| 4.1 | Run as non-root | `USER` directive or `user:` in compose |
| 4.2 | Use trusted base images | Pin to specific digest or version tag |
| 4.3 | Do not install unnecessary packages | Use `-slim` or `-alpine` variants |
| 4.7 | Add HEALTHCHECK | `healthcheck:` in compose or `HEALTHCHECK` in Dockerfile |
| 4.9 | Set resource limits | `deploy.resources.limits` in compose |
| 5.2 | Restrict network access | Explicit `networks:` with `internal: true` |
| 5.10 | Set `read_only: true` where possible | Read-only root filesystem |
| 5.25 | Drop all capabilities, add back only needed | `cap_drop: ALL` + selective `cap_add` |

### Minimal Docker Compose Template

```yaml
services:
  app:
    image: oven/bun:1.3.14-slim
    user: '1001:1001'
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/api/health']
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  backend:
    driver: bridge
```

---

## 4. Network Security

### Principles

| Principle | Implementation |
|-----------|----------------|
| **Bind to localhost** | `127.0.0.1:5432:5432` — never `0.0.0.0` |
| **Explicit allow-lists** | CORS origins in env, not `*` |
| **TLS everywhere** | HSTS headers, Fly.io auto-TLS, Let's Encrypt |
| **Network isolation** | Separate Docker networks for frontend/backend |
| **Rate limiting** | Per-IP limits on all endpoints |

### CORS Configuration

```typescript
// ✅ Explicit origins from env
const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

// ❌ Never use wildcard in production
app.use('*', cors({ origin: '*' }));
```

### Security Headers (Already Implemented)

```typescript
// apps/api/src/index.ts — these are correct
c.header('X-Content-Type-Options', 'nosniff');
c.header('X-Frame-Options', 'DENY');
c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

---

## 5. SSRF Protection

### Current Implementation (`apps/api/src/lib/ssrf.ts`)

| Layer | Status | Notes |
|-------|--------|-------|
| Scheme allowlist | ✅ | `http:`, `https:`, `ws:`, `wss:` only |
| Private IP blocking | ✅ | `10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `169.254.x` |
| IPv6 loopback | ✅ | `::1`, `::`, `fe80:`, `fc/fd` |
| `.local` / `.internal` | ✅ | Blocked |
| Cloud metadata | ✅ | `metadata.google.internal`, `metadata.google` |
| **DNS rebinding** | ⚠️ | **Not protected** — hostname validated before DNS resolution |

### DNS Rebinding Fix

SSRF validation must check the **resolved IP**, not just the hostname. An attacker can register `evil.com` → first DNS response: `1.2.3.4` (passes check) → second response: `169.254.169.254` (bypasses check).

```typescript
import { lookup } from 'node:dns/promises';

export async function assertSafeUrlResolved(rawUrl: string): Promise<URL> {
  const parsed = assertSafeUrl(rawUrl); // existing hostname check
  const { address } = await lookup(parsed.hostname);
  if (isPrivateIpv4(address) || isPrivateIpv6(address)) {
    throw new Error('URL resolves to private network');
  }
  return parsed;
}
```

---

## 6. Database Security

### Connection Pooling

```typescript
// apps/api/src/db/index.ts
const client = postgres(DATABASE_URL, {
  max: 20,            // max connections in pool
  idle_timeout: 20,   // close idle connections after 20s
  connect_timeout: 10, // connection attempt timeout
});
```

### Data Retention

Unbounded table growth causes disk exhaustion and slow queries. Every table with timestamps needs a retention policy.

| Table | Retention | Rationale |
|-------|-----------|-----------|
| `health_checks` | 90 days | Operational data, not historical analytics |
| `relay_events` | 30 days | Captured events are ephemeral debug data |
| `relay_info_snapshots` | 180 days | NIP-11 changes are infrequent, keep longer |
| `relay_discoveries` | 180 days | Monitor data, useful for trending |
| `relay_list_entries` | 365 days | Relay list popularity changes slowly |

### Backup Strategy

```bash
# Daily pg_dump to S3
pg_dump -Fc $DATABASE_URL | aws s3 s3://relay-dog-backups/$(date +%Y-%m-%d).dump

# Point-in-time recovery (if using managed Postgres)
# Enable WAL archiving on Fly Postgres or Neon
```

---

## 7. Supply Chain Security

### Dependency Management

| Tool | Purpose | Frequency |
|------|---------|-----------|
| `bun.lock` | Lockfile (already committed) | Every `bun install` |
| `bun audit` | Known vulnerabilities | CI on every push |
| OSV Scanner | Broader vulnerability database | CI on every push |
| `--frozen-lockfile` | Prevent lockfile drift in CI | Always in CI |

### CI Dependency Install

```yaml
# ✅ Frozen lockfile — CI installs exactly what lockfile says
- run: bun install --frozen-lockfile

# ❌ Allows lockfile modification
- run: bun install
```

---

## 8. Observability Requirements

### Structured Logging

Replace `process.stderr.write` with structured JSON logs:

```typescript
// ✅ Structured — searchable, aggregatable, parseable
const log = {
  level: 'error',
  msg: 'Relay check failed',
  relayId: relay.id,
  relayUrl: relay.url,
  error: err.message,
  duration_ms: Date.now() - start,
  timestamp: new Date().toISOString(),
};
process.stderr.write(JSON.stringify(log) + '\n');

// ❌ Unstructured — unsearchable in log aggregators
process.stderr.write(`Error checking ${relay.url}: ${err.message}\n`);
```

### Health Check Must Verify DB

```typescript
// ✅ Real health signal — DB connectivity matters
app.get('/api/health', async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'ok', uptime: process.uptime(), db: 'connected' });
  } catch {
    return c.json(
      { status: 'degraded', uptime: process.uptime(), db: 'disconnected' },
      503,
    );
  }
});

// ❌ Lies — API up but DB down means the service is broken
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() });
});
```

---

## 9. Deployment Checklist

### Before First Deploy

- [ ] `.env` files never committed to git (`git log --all -- .env`)
- [ ] `.dockerignore` exists and excludes secrets
- [ ] Dockerfiles don't `COPY . .`
- [ ] All GitHub Actions pinned to SHA
- [ ] CI workflow has `permissions: contents: read`
- [ ] `docker-compose.yml` has `security_opt`, `cap_drop`, resource limits
- [ ] SSRF protection checks resolved IPs (DNS rebinding fix)
- [ ] Health check endpoint verifies database connectivity
- [ ] Data retention cron configured
- [ ] Database backup schedule configured
- [ ] CORS_ORIGINS set to production domain(s)
- [ ] NODE_ENV=production
- [ ] API_KEY set to strong random value
- [ ] SSL/TLS configured (Fly.io auto-TLS or Caddy)

### Recurring Checks

| Check | Frequency | How |
|-------|-----------|-----|
| Dependency vulnerabilities | Every CI run | `bun audit` + OSV Scanner |
| `.env` in git history | Once (verify) | `git log --all --full-history -- .env` |
| Container base image updates | Weekly | Dependabot / Renovate |
| Docker image vulnerability scan | Every build | `docker scout cves` or Trivy |
| SSL certificate expiry | Monthly | Auto-renewed via Fly/Caddy |
| Database backup integrity | Weekly | Restore test to verify |

---

*Last updated: v0.9.0 — 2026-07-01*
