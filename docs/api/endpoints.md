---
title: "⚡ API Endpoints"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# ⚡ API Endpoints

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


The Relay Scope API is a REST server built with **Hono** running on **Bun**.

## Base URL

```
http://localhost:3001
```

In development, the Vite dev server proxies `/api/*` requests to the API server, so the frontend can use relative URLs (`/api/relays`).

## Quick Start

```bash
# Start the API server
cd apps/api
bun run dev

# Test the health endpoint
curl http://localhost:3001/api/health
```

## Authentication

Mutating endpoints (`POST`, `PUT`, `DELETE`) require a Bearer token:

```bash
curl -H "Authorization: Bearer $API_KEY" -X POST http://localhost:3001/api/relays \
  -H 'Content-Type: application/json' \
  -d '{"url":"wss://relay.damus.io"}'
```

| Route Type | Auth Required |
|------------|---------------|
| `GET` (all routes) | ❌ Public |
| `POST`, `PUT`, `DELETE` | ✅ `Authorization: Bearer <API_KEY>` |

In development, if `API_KEY` is not set, write endpoints are unprotected (with a warning logged). In production, the server exits if `API_KEY` is unset.

## Rate Limiting

All endpoints are rate-limited per IP address:

| Route Type | Limit |
|------------|-------|
| Write (`POST`, `PUT`, `DELETE`, `PATCH`) | 20 requests/min |
| Read (`GET`) | 200 requests/min |

## Response Format

All endpoints return JSON in a consistent format:

```typescript
// Success
{
  "success": true,
  "data": T,
  "meta": {           // Optional, for list endpoints
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": "Relay not found"
}
```

## Endpoints

| Method | Path | Auth | Description | Docs |
|--------|------|------|-------------|------|
| `GET` | `/api/health` | — | Server health check | [→](#health-check) |
| `GET` | `/api/relays` | — | List all relays | [→](#list-relays) |
| `GET` | `/api/relays/lookup` | — | Lookup relay by URL | [→](#lookup-relay) |
| `GET` | `/api/relays/:id` | — | Get single relay | [→](#get-relay) |
| `POST` | `/api/relays` | ✅ | Add a new relay | [→](#add-relay) |
| `PUT` | `/api/relays/:id` | ✅ | Update relay | [→](#update-relay) |
| `DELETE` | `/api/relays/:id` | ✅ | Remove relay | [→](#remove-relay) |
| `POST` | `/api/relays/:id/check` | ✅ | Run health check | [→](#run-health-check) |
| `GET` | `/api/relays/:id/history` | — | Health check history | [→](#health-history) |
| `GET` | `/api/relays/:id/nip11` | — | NIP-11 snapshot history | [→](#nip11-history) |
| `GET` | `/api/relays/:id/discoveries` | — | NIP-66 monitor observations | [→](#relay-discoveries) |
| `POST` | `/api/relays/:id/discoveries` | ✅ | Upsert discovery from monitor | [→](#upsert-discovery) |
| `GET` | `/api/relays/:id/popularity` | — | NIP-65 read/write relay counts | [→](#relay-popularity) |
| `POST` | `/api/relays/:id/popularity` | ✅ | Upsert relay list entry | [→](#upsert-popularity) |
| `GET` | `/api/directory` | — | Browse directory with filters | [→](#directory) |
| `GET` | `/api/directory/countries` | — | List available countries | [→](#directory-countries) |
| `GET` | `/api/directory/compare/:id1/:id2` | — | Compare two relays | [→](#compare-relays) |

---

## Endpoints Detail

### Health Check

```
GET /api/health
```

**Response** `200 OK`

```json
{
  "status": "ok",
  "uptime": 12345.67,
  "checks": {
    "api": "ok",
    "database": "connected"
  },
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

**Response** `503 Service Unavailable` when a dependency is unavailable:

```json
{
  "status": "degraded",
  "uptime": 12345.67,
  "checks": {
    "api": "ok",
    "database": "disconnected"
  },
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

---

### List Relays

```
GET /api/relays
```

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | `string` | — | Search by name or URL (case-insensitive) |
| `nips` | `string` | — | Comma-separated NIP numbers to filter by |
| `authRequired` | `boolean` | — | Filter by auth required |
| `paymentRequired` | `boolean` | — | Filter by payment required |
| `country` | `string` | — | Filter by ISO country code |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Results per page (max 100) |
| `sortBy` | `string` | `name` | Sort field: `name`, `url`, `lastChecked`, `latency` |
| `sortOrder` | `string` | `asc` | Sort direction: `asc`, `desc` |

**Example**

```bash
curl "http://localhost:3001/api/relays?search=damus&nips=42"
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "wss://relay.damus.io",
      "name": "Damus Relay",
      "description": "The official Damus relay",
      "supportedNips": [1, 2, 4, 11, 12, 16, 20, 42],
      "limitations": { "auth_required": false, "payment_required": false },
      "lastHealthCheck": {
        "httpReachable": true,
        "websocketConnectable": true,
        "latencyMs": 145
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Lookup Relay

```
GET /api/relays/lookup?url=wss://relay.damus.io
```

Lookup a relay by its URL. Returns the relay's `id` and `url` if found. Useful for resolving a URL to a UUID for other API calls.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | ✅ | Relay WebSocket URL to look up |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "wss://relay.damus.io"
  }
}
```

**Response** `200 OK` (not found)

```json
{
  "success": false,
  "data": null
}
```

---

### Get Relay

```
GET /api/relays/:id
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "url": "wss://relay.damus.io",
    "name": "Damus Relay",
    "supportedNips": [1, 4, 42],
    "limitations": {
      "max_message_length": 131072,
      "max_subscriptions": 20,
      "auth_required": false,
      "payment_required": false
    },
    "banner": "https://...",
    "pubkey": "abc123...",
    "fees": {
      "admission": [{ "amount": 0, "unit": "msats" }]
    },
    "lastHealthCheck": { ... },
    "latestInfo": {
      "nip11": { ... },
      "fetchedAt": "2026-06-30T..."
    }
  }
}
```

---

### Add Relay

```
POST /api/relays
```

**Request Body**

```json
{
  "url": "wss://relay.damus.io",
  "name": "Damus Relay",
  "isPublic": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | ✅ | Relay WebSocket URL (auto-normalizes missing `wss://`) |
| `name` | `string` | — | Human-readable name |
| `isPublic` | `boolean` | — | Show in public directory (default: `true`) |

**Behavior**: The API automatically fetches the relay's NIP-11 document and stores the initial snapshot. SSRF protection blocks private/loopback IPs.

**Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "new-uuid-...",
    "url": "wss://relay.damus.io",
    "name": "Damus Relay",
    "supportedNips": [1, 2, 4, 11, ...],
    "createdAt": "2026-06-30T..."
  }
}
```

---

### Update Relay

```
PUT /api/relays/:id
```

**Request Body** — any subset of whitelisted fields:

```json
{
  "name": "Updated Name",
  "country": "US",
  "isPublic": false
}
```

Allowed fields: `name`, `description`, `isPublic`, `country`. All other fields are ignored (mass assignment protection).

---

### Remove Relay

```
DELETE /api/relays/:id
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": { "id": "...", "url": "wss://..." }
}
```

**Cascading deletes**: Removing a relay also removes all its events, snapshots, discoveries, and relay list entries. Legacy tables (`health_checks`, `monitoring_jobs`) also cascade-delete via database FK constraints.

---

### Run Health Check

```
POST /api/relays/:id/check
```

Triggers an immediate health check (HTTP, CORS, WebSocket) and stores the result.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "check-uuid-...",
    "relayId": "relay-uuid-...",
    "httpReachable": true,
    "corsConfigured": true,
    "websocketConnectable": true,
    "latencyMs": 145,
    "httpStatusCode": 200,
    "errorMessage": null,
    "checkedAt": "2026-06-30T..."
  }
}
```

---

### Health History

```
GET /api/relays/:id/history?limit=50
```

Returns recent health check results, ordered by most recent first.

---

### NIP-11 History

```
GET /api/relays/:id/nip11?limit=20
```

Returns NIP-11 snapshot history, useful for tracking when a relay changes its configuration.

---

### Relay Discoveries (NIP-66)

```
GET /api/relays/:id/discoveries
```

Returns all NIP-66 monitor observations for a relay, including aggregated stats.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "discoveries": [
      {
        "id": "...",
        "relayUrl": "wss://relay.damus.io",
        "monitorPubkey": "abc123...",
        "rttOpen": 234,
        "rttRead": 150,
        "rttWrite": 200,
        "networkType": "clearnet",
        "relayType": "Regular",
        "supportedNips": [1, 11, 42],
        "requirements": ["auth"],
        "topics": ["nsfw"],
        "geohash": "ww8p1r4t8",
        "discoveredAt": "2026-06-30T..."
      }
    ],
    "stats": {
      "monitorCount": 5,
      "avgRttOpen": 234,
      "avgRttRead": 150,
      "avgRttWrite": 200
    }
  }
}
```

---

### Upsert Discovery

```
POST /api/relays/:id/discoveries
```

Upsert a NIP-66 monitor observation. Uses `ON CONFLICT` to update existing observations from the same monitor.

**Request Body**

```json
{
  "monitorPubkey": "abc123...",
  "rttOpen": 234,
  "rttRead": 150,
  "rttWrite": 200,
  "networkType": "clearnet",
  "relayType": "Regular",
  "supportedNips": [1, 11, 42],
  "requirements": ["auth"],
  "topics": ["nsfw"],
  "geohash": "ww8p1r4t8"
}
```

---

### Relay Popularity (NIP-65)

```
GET /api/relays/:id/popularity
```

Returns read/write relay list counts based on NIP-65 kind 10002 events.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "readCount": 42,
    "writeCount": 18,
    "readers": ["pubkey1...", "pubkey2..."],
    "writers": ["pubkey3..."]
  }
}
```

---

### Upsert Popularity

```
POST /api/relays/:id/popularity
```

Upsert a NIP-65 relay list entry. Uses `ON CONFLICT` to update existing entries from the same author.

**Request Body**

```json
{
  "authorPubkey": "abc123...",
  "marker": "write"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authorPubkey` | `string` | ✅ | Author's public key (hex) |
| `marker` | `string` | — | `read`, `write`, or null (both) |

---

### Directory

```
GET /api/directory
```

Browse the relay directory with filters. Only returns public relays (`is_public = true`).

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | `string` | — | Search by name or URL (ILIKE) |
| `nips` | `string` | — | Comma-separated NIP numbers (relay must support ALL) |
| `authRequired` | `boolean` | — | Filter by auth required |
| `paymentRequired` | `boolean` | — | Filter by payment required |
| `country` | `string` | — | Filter by ISO country code |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Results per page (max 100) |
| `sortBy` | `string` | `name` | Sort field: `name`, `url`, `lastChecked`, `latency` |
| `sortOrder` | `string` | `asc` | Sort direction: `asc`, `desc` |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "relays": [
      {
        "id": "...",
        "url": "wss://relay.damus.io",
        "name": "Damus Relay",
        "supportedNips": [1, 11, 42],
        "country": "US",
        "lastHealthCheck": { ... }
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

---

### Directory Countries

```
GET /api/directory/countries
```

Returns a list of distinct country codes from public relays.

**Response** `200 OK`

```json
{
  "success": true,
  "data": ["DE", "FR", "JP", "US"]
}
```

---

### Compare Relays

```
GET /api/directory/compare/:id1/:id2
```

Side-by-side comparison of two relays with difference analysis.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "relayA": { ... },
    "relayB": { ... },
    "diff": {
      "nipsOnlyInA": [42],
      "nipsOnlyInB": [50],
      "sharedNips": [1, 11],
      "latencyWinner": "A",
      "healthWinner": "B"
    }
  }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| `400` | Bad request — missing or invalid parameters, SSRF blocked |
| `401` | Unauthorized — missing or invalid `API_KEY` on mutating routes |
| `404` | Resource not found |
| `409` | Conflict — relay already exists (on POST) |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error (generic message in production) |

## Body Size Limit

All request bodies are capped at **100 KB**.

---
