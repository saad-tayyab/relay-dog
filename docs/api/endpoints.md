# ⚡ API Reference

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

| Method | Path | Description | Docs |
|--------|------|-------------|------|
| `GET` | `/api/health` | Server health check | [→](#health-check) |
| `GET` | `/api/relays` | List all relays | [→](#list-relays) |
| `GET` | `/api/relays/:id` | Get single relay | [→](#get-relay) |
| `POST` | `/api/relays` | Add a new relay | [→](#add-relay) |
| `PUT` | `/api/relays/:id` | Update relay | [→](#update-relay) |
| `DELETE` | `/api/relays/:id` | Remove relay | [→](#remove-relay) |
| `POST` | `/api/relays/:id/check` | Run health check | [→](#run-health-check) |
| `GET` | `/api/relays/:id/history` | Health check history | [→](#health-history) |
| `GET` | `/api/relays/:id/nip11` | NIP-11 snapshot history | [→](#nip11-history) |

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
  "uptime": 12345.67
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
    "total": 1,
    "totalPages": 1
  }
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

**Behavior**: The API automatically fetches the relay's NIP-11 document and stores the initial snapshot.

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

**Request Body** — any subset of fields:

```json
{
  "name": "Updated Name",
  "country": "US",
  "isPublic": false
}
```

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

**Cascading deletes**: Removing a relay also removes all its health checks, events, snapshots, and monitoring jobs.

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

## Error Codes

| Code | Meaning |
|------|---------|
| `400` | Bad request — missing or invalid parameters |
| `404` | Resource not found |
| `409` | Conflict — relay already exists (on POST) |
| `500` | Internal server error |

## Rate Limiting

Not implemented in Phase 1. All endpoints are unauthenticated and unthrottled. Production deployments should add rate limiting middleware.
