# 🔒 Phase 6: Security Hardening

## Status

**Complete** ✅ (2026-06-30)

## Overview

Full-stack security hardening across infrastructure, API, and frontend. Addresses findings from the June 2026 security audit: unauthenticated mutating endpoints, server-side SSRF, Docker misconfiguration, missing rate limits, and incomplete HTTP security headers. This phase is a **deploy blocker** — required before any internet-facing production launch.

## User Stories

1. **As an operator**, I want mutating API routes protected so random users cannot add, modify, or delete relay records.
2. **As an operator**, I want server-side URL fetches validated so attackers cannot probe internal networks via SSRF.
3. **As a developer**, I want request bodies validated with schemas so malformed input cannot corrupt the database.
4. **As a user**, I want the SPA served with security headers so XSS and clickjacking risks are minimized.
5. **As an operator**, I want dependency scanning in CI so vulnerable packages are caught before merge.

## Features

### P0 — Deploy Blockers

#### 1. API Key Authentication
Bearer token middleware on all mutating relay routes. GET routes remain public.

**New file:** `apps/api/src/middleware/auth.ts`

```typescript
export const requireApiKey = createMiddleware(async (c, next) => {
  const expected = process.env.API_KEY;
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== expected) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  await next();
});
```

**Protected routes** (in `apps/api/src/routes/relays.ts`):

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/relays` | Required |
| `PUT` | `/api/relays/:id` | Required |
| `DELETE` | `/api/relays/:id` | Required |
| `POST` | `/api/relays/:id/check` | Required |
| `GET` | `/api/relays/*` | Public |

Production startup exits if `API_KEY` is unset.

#### 2. SSRF Protection
URL validator blocks private, loopback, link-local, and cloud metadata targets before any server-side `fetch` or `WebSocket`.

**New file:** `apps/api/src/lib/ssrf.ts`

```typescript
// Blocks: RFC1918, 127.0.0.0/8, 169.254.0.0/16, ::1,
// metadata.google.internal, *.local, *.internal
// Allows: http, https, ws, wss only
export function assertSafeUrl(rawUrl: string): URL { ... }
```

**Applied in:**
- `POST /api/relays` — NIP-11 fetch on relay add
- `POST /api/relays/:id/check` — HTTP + WebSocket health check
- `relayMonitor.ts` — background health check loop

#### 3. PUT Mass Assignment Fix
Replace unrestricted body spread with Zod-whitelisted fields matching `UpdateRelayDto`:

```typescript
// Before (vulnerable)
.set({ ...body, updatedAt: new Date() })

// After (safe)
const fields = Object.fromEntries(
  Object.entries(body).filter(([, v]) => v !== undefined)
);
.set({ ...fields, updatedAt: new Date() })
```

Allowed fields: `name`, `description`, `isPublic`, `country`.

#### 4. Rate Limiting
In-memory IP-based rate limiter via `hono-rate-limiter`:

| Route type | Limit |
|------------|-------|
| Write (`POST`, `PUT`, `DELETE`, `PATCH`) | 20 req/min |
| Read (`GET`) | 200 req/min |

### P1 — Production Hardening

#### 5. Docker Hardening
Changes to `docker-compose.yml`:

- Postgres bound to `127.0.0.1:5432` (not `0.0.0.0`)
- Password via `${POSTGRES_PASSWORD}` env interpolation
- Healthcheck: `pg_isready -U postgres -d relayscope`
- Resource limits: 1 CPU, 512 MB RAM
- `restart: unless-stopped`

#### 6. Production Error Handler
Generic client errors in production; full errors logged server-side:

```typescript
app.onError((err, c) => {
  console.error('[error]', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  return c.json({ success: false, error: message }, 500);
});
```

Health check `errorMessage` values sanitized to categorized strings: `timeout`, `connection_refused`, `dns_error`, `tls_error`, `invalid_target`, `websocket_error`.

#### 7. Security Headers
**API** (`apps/api/src/index.ts`):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) |

**Frontend** (`apps/web/index.html`):

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; connect-src 'self' wss: https:; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'">
```

#### 8. Input Validation (Zod)
**New file:** `apps/api/src/lib/schemas.ts`

| Schema | Fields |
|--------|--------|
| `createRelaySchema` | `url` (1–500 chars), `name` (optional), `isPublic` (optional) |
| `updateRelaySchema` | `name`, `description`, `isPublic`, `country` (all optional) |

Applied via `@hono/zod-validator` on `POST /` and `PUT /:id`.

Pagination capped at **100** on all list, history, and NIP-11 routes.

#### 9. CI Dependency Scanning
**New file:** `.github/workflows/security.yml`

- Runs `bun audit` on every PR and push to `main`
- Runs OSV Scanner weekly (Mondays 06:00 UTC)

#### 10. Monitor Interval Env Var
`MONITOR_INTERVAL_MS` wired in `apps/api/src/index.ts` (was hardcoded to `60_000`).

### P2 — Defense in Depth

#### 11. Database Connection Guard
- Removed `DATABASE_URL` export from `apps/api/src/db/index.ts`
- Production startup exits if `DATABASE_URL` is unset

#### 12. Frontend Image URL Allowlisting
`safeHttpsIconUrl()` in `apps/web/src/utils/relay.ts` — returns `null` for non-`https:` icon URLs.

Used in `RelayProfile.svelte` and `RelayCard.svelte` with `referrerpolicy="no-referrer"`.

#### 13. NIP-42 Challenge Validation
In `useNip42Auth.svelte.ts`:

- AUTH challenge: printable ASCII, max 256 chars
- `relayUrl`: validated with `URL` constructor before signing

#### 14. Cleanup
- Removed unused `node-cron` dependency
- `prettyJSON()` disabled in production
- Request logger disabled in production
- `.env.example` updated with `API_KEY`, `CORS_ORIGINS`, `POSTGRES_PASSWORD`

## Technical Details

### Request Flow (Post-Hardening)

```mermaid
flowchart TD
    Client -->|"GET /api/relays"| ReadRateLimit
    Client -->|"POST/PUT/DELETE"| WriteRateLimit
    ReadRateLimit --> PublicRoutes
    WriteRateLimit --> AuthMiddleware
    AuthMiddleware -->|"Bearer token OK"| MutatingRoutes
    AuthMiddleware -->|"401 Unauthorized"| Client
    MutatingRoutes --> ZodValidator
    ZodValidator --> SSRFGuard
    SSRFGuard -->|"blocked: private IP"| ErrorResponse
    SSRFGuard -->|"allowed"| ExternalFetch
```

### OWASP Top 10 (2025) Coverage

| Category | Mitigation |
|----------|------------|
| A01 Broken Access Control | API key on mutating routes |
| A02 Cryptographic Failures | `DATABASE_URL` no longer exported |
| A03 Injection | Drizzle parameterized SQL (existing) |
| A05 Security Misconfiguration | Docker hardening, security headers |
| A06 Vulnerable Components | CI `bun audit` + OSV Scanner |
| A07 Auth Failures | Rate limiting, SSRF guard |
| A10 SSRF | `assertSafeUrl()` on all server-side fetches |

## Component Structure

```
apps/api/src/
├── middleware/
│   └── auth.ts                 # Bearer token middleware
├── lib/
│   ├── ssrf.ts                 # URL safety validator
│   ├── schemas.ts              # Zod input schemas
│   └── errors.ts               # Error categorization
├── routes/
│   └── relays.ts               # Auth + SSRF + Zod applied
└── jobs/
    └── relayMonitor.ts         # SSRF guard in background loop

apps/web/src/
├── utils/
│   └── relay.ts                # safeHttpsIconUrl()
├── components/
│   ├── RelayProfile.svelte     # https-only icons
│   └── RelayCard.svelte        # https-only icons
└── lib/composables/
    └── useNip42Auth.svelte.ts    # Challenge + URL validation
```

## API Changes

| Change | Detail |
|--------|--------|
| Auth required | `POST`, `PUT`, `DELETE`, `POST /:id/check` need `Authorization: Bearer <API_KEY>` |
| Rate limits | 20 write / 200 read requests per minute per IP |
| Pagination | `limit` capped at 100 on all paginated endpoints |
| Error responses | Generic message in production; categorized health check errors |

No new endpoints added. Existing GET routes remain public.

## Infrastructure Changes

| File | Change |
|------|--------|
| `docker-compose.yml` | Localhost bind, env password, healthcheck, resource limits |
| `.env.example` | `API_KEY`, `CORS_ORIGINS`, `POSTGRES_PASSWORD` |
| `.github/workflows/security.yml` | Dependency scanning CI |

## Database Changes

None — security changes are application-layer only.

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `zod` | Request body validation (Zod 4) | `^4.4.3` |
| `@hono/zod-validator` | Hono Zod middleware | `^0.8.0` |
| `hono` | HTTP framework (peer for validator) | `^4.12.27` |
| `hono-rate-limiter` | IP-based rate limiting | `^0.5.3` |

**Removed:** `node-cron` (unused)

## Environment Variables (New)

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `API_KEY` | Yes | Bearer token for mutating API routes |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed origins |
| `POSTGRES_PASSWORD` | Yes (Docker) | Postgres password (not hardcoded) |
| `MONITOR_INTERVAL_MS` | No | Background monitor interval (default: 60000) |

## Testing

### Prerequisites

```bash
# 1. Copy env and start Postgres
cp .env.example .env
docker compose up -d

# 2. Install and run API + web (from repo root)
bun install
bun run dev   # or: cd apps/api && bun run dev
```

Ensure `.env` includes:

```bash
API_KEY=dev-api-key-change-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/relayscope
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Set `AUTH="Authorization: Bearer dev-api-key-change-in-production"` for mutating requests below.

### 1. Auth middleware

```bash
# Should fail — no token
curl -s -X POST http://localhost:3001/api/relays \
  -H 'Content-Type: application/json' \
  -d '{"url":"wss://relay.damus.io"}' | jq

# Should succeed (201 or 409 if already exists)
curl -s -X POST http://localhost:3001/api/relays \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"url":"wss://relay.damus.io"}' | jq

# Public read — no token required
curl -s http://localhost:3001/api/relays | jq
```

### 2. SSRF protection

```bash
# Should return 400 — private/loopback blocked
curl -s -X POST http://localhost:3001/api/relays \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"url":"http://127.0.0.1"}' | jq

curl -s -X POST http://localhost:3001/api/relays \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"url":"http://169.254.169.254"}' | jq
```

### 3. Mass assignment + Zod validation

```bash
# Get a relay id first
RELAY_ID=$(curl -s http://localhost:3001/api/relays | jq -r '.data[0].id')

# Should ignore disallowed fields (url/id) — only whitelisted fields update
curl -s -X PUT "http://localhost:3001/api/relays/$RELAY_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"Test Relay","url":"wss://evil.example","id":"hacked"}' | jq

# Invalid body — Zod rejects
curl -s -X POST http://localhost:3001/api/relays \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"url":""}' | jq
```

### 4. Rate limiting

```bash
# Send 21 POST requests in quick succession — expect 429 on the last ones
for i in $(seq 1 21); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/relays \
    -H "$AUTH" -H 'Content-Type: application/json' \
    -d "{\"url\":\"wss://test-$i.example.com\"}")
  echo "Request $i: HTTP $code"
done
```

### 5. Security headers

```bash
curl -sI http://localhost:3001/api/health | grep -iE 'content-security|permissions-policy|x-content-type|referrer-policy'
```

### 6. Production error handler

```bash
# With NODE_ENV=production, 500 responses should not leak stack traces
NODE_ENV=production API_KEY=dev-api-key-change-in-production bun run apps/api/src/index.ts
# Trigger an error (e.g. bad relay id format) and confirm generic message
```

### 7. Pagination cap

```bash
# limit=500 should be capped to 100
curl -s 'http://localhost:3001/api/relays?limit=500' | jq '.meta.limit'
```

### 8. Frontend checks (manual)

1. Open `http://localhost:5173` — relay with `http://` icon should not show image
2. Connect to an auth-required relay — malformed AUTH challenge should not trigger signing
3. View page source — CSP meta tag present in `index.html`

### 9. Docker / infra

```bash
# Postgres should only listen on localhost
docker compose ps
ss -tlnp | grep 5432   # should show 127.0.0.1:5432, not 0.0.0.0

docker compose exec postgres pg_isready -U postgres -d relayscope
```

### 10. CI dependency scanning

```bash
bun audit
# GitHub Actions workflow: .github/workflows/security.yml (runs on PR + weekly)
```

### Checklist (automated expectations)

1. `POST /api/relays` without token → `401 Unauthorized`
2. `POST /api/relays` with valid Bearer token → `201` or `409`
3. `POST /api/relays` with `url: http://127.0.0.1` → `400` (SSRF blocked)
4. `PUT /api/relays/:id` with extra fields → disallowed fields ignored
5. 21 write requests in 1 minute → `429 Too Many Requests`
6. `GET /api/relays` without token → succeeds (public)
7. Health check on unreachable relay → categorized error, not raw exception text
8. Relay icon with `http://` URL → not rendered in UI
9. NIP-42 malformed challenge → rejected before signing
10. `bun audit` → runs in CI on every PR

## Deployment Checklist

- [ ] Set strong `API_KEY` in production `.env`
- [ ] Set `POSTGRES_PASSWORD` (not default `postgres`)
- [ ] Set `CORS_ORIGINS` to production frontend URL
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy with HSTS + CSP headers for static SPA
- [ ] Verify Postgres is not exposed beyond `127.0.0.1`

---

*Previous: [Phase 5 — Relay Directory & Comparison](phase-5-directory.md) | Next: [Phase 7 — NIP Compliance & Modernization](phase-7-nip-compliance.md)*

---

*Last updated: v0.6.0 — 2026-06-30*
