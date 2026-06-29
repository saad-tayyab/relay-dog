# 🗄️ Database Schema

Relay Scope uses **PostgreSQL** with **Drizzle ORM**. The schema defines 5 tables for tracking relays, their info, health status, events, and monitoring jobs.

## Entity Relationship Diagram

```mermaid
erDiagram
    relays ||--o{ relay_info_snapshots : "has NIP-11 history"
    relays ||--o{ health_checks : "has health history"
    relays ||--o{ relay_events : "captures events"
    relays ||--o| monitoring_jobs : "scheduled checks"

    relays {
        uuid id PK
        text url UK
        text name
        text description
        text icon
        text software
        text version
        integer[] supported_nips
        jsonb limitations
        text country
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    relay_info_snapshots {
        uuid id PK
        uuid relay_id FK
        jsonb nip11
        jsonb raw_json
        timestamp fetched_at
    }

    health_checks {
        uuid id PK
        uuid relay_id FK
        boolean http_reachable
        boolean cors_configured
        boolean websocket_connectable
        integer latency_ms
        integer http_status_code
        text error_message
        timestamp checked_at
    }

    relay_events {
        uuid id PK
        uuid relay_id FK
        text nostr_event_id
        text pubkey
        integer kind
        text content
        jsonb tags
        timestamp created_at
        timestamp received_at
    }

    monitoring_jobs {
        uuid id PK
        uuid relay_id FK UK
        boolean enabled
        integer interval_ms
        timestamp last_run_at
        timestamp next_run_at
        timestamp created_at
    }
```

## Table Reference

### `relays`

Core table storing relay information. One row per relay.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `url` | `text` | UK, NOT NULL | Relay WebSocket URL (normalized) |
| `name` | `text` | ✅ | Human-readable name from NIP-11 |
| `description` | `text` | ✅ | Relay description from NIP-11 |
| `icon` | `text` | ✅ | Icon URL from NIP-11 |
| `software` | `text` | ✅ | Server software name |
| `version` | `text` | ✅ | Server version string |
| `supported_nips` | `integer[]` | ✅ | Array of supported NIP numbers |
| `limitations` | `jsonb` | ✅ | NIP-11 `limitation` object |
| `country` | `text` | ✅ | ISO country code (manual) |
| `is_public` | `boolean` | ✅ | Show in public directory (default: true) |
| `created_at` | `timestamptz` | NOT NULL | First seen timestamp |
| `updated_at` | `timestamptz` | NOT NULL | Last updated timestamp |

**Indexes**: `url`, `supported_nips` (GIN)

### `relay_info_snapshots`

Historical NIP-11 snapshots. A new row is inserted each time we fetch updated NIP-11 data.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `relay_id` | `uuid` | FK, NOT NULL | References `relays.id` (CASCADE) |
| `nip11` | `jsonb` | NOT NULL | Parsed NIP-11 document |
| `raw_json` | `jsonb` | NOT NULL | Raw JSON response |
| `fetched_at` | `timestamptz` | NOT NULL | When this snapshot was fetched |

**Indexes**: `relay_id`, `fetched_at`

### `health_checks`

Each row represents a single health check result for a relay.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `relay_id` | `uuid` | FK, NOT NULL | References `relays.id` (CASCADE) |
| `http_reachable` | `boolean` | NOT NULL | HTTP endpoint responded OK |
| `cors_configured` | `boolean` | NOT NULL | CORS headers present |
| `websocket_connectable` | `boolean` | NOT NULL | WebSocket connection succeeded |
| `latency_ms` | `integer` | ✅ | HTTP round-trip time in ms |
| `http_status_code` | `integer` | ✅ | HTTP response status code |
| `error_message` | `text` | ✅ | Error details if check failed |
| `checked_at` | `timestamptz` | NOT NULL | When this check was performed |

**Indexes**: `relay_id`, `checked_at`

### `relay_events`

Captured Nostr events received from relay WebSocket connections.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `relay_id` | `uuid` | FK, NOT NULL | References `relays.id` (CASCADE) |
| `nostr_event_id` | `text` | NOT NULL | Event ID (hex) |
| `pubkey` | `text` | NOT NULL | Author public key (hex) |
| `kind` | `integer` | NOT NULL | Event kind number |
| `content` | `text` | ✅ | Event content |
| `tags` | `jsonb` | ✅ | Event tags array |
| `created_at` | `timestamptz` | NOT NULL | Event's `created_at` timestamp |
| `received_at` | `timestamptz` | NOT NULL | When we received the event |

**Indexes**: `relay_id`, `kind`, `nostr_event_id`, `created_at`

### `monitoring_jobs`

Scheduled monitoring configuration per relay. One job per relay.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `relay_id` | `uuid` | FK, UK, NOT NULL | References `relays.id` (CASCADE) |
| `enabled` | `boolean` | NOT NULL | Job active (default: true) |
| `interval_ms` | `integer` | NOT NULL | Check interval in ms (default: 60000) |
| `last_run_at` | `timestamptz` | ✅ | When this job last executed |
| `next_run_at` | `timestamptz` | ✅ | When this job should next run |
| `created_at` | `timestamptz` | NOT NULL | Job creation timestamp |

**Indexes**: `enabled`

## Common Queries

### Get relays with latest health check

```sql
SELECT r.*, hc.*
FROM relays r
LEFT JOIN health_checks hc ON r.id = hc.relay_id
  AND hc.checked_at = (
    SELECT MAX(checked_at) FROM health_checks WHERE relay_id = r.id
  )
ORDER BY r.updated_at DESC;
```

### Find relays by supported NIP

```sql
SELECT * FROM relays
WHERE 42 = ANY(supported_nips);
```

### Health check success rate (last 24h)

```sql
SELECT
  r.url,
  COUNT(*) as total_checks,
  SUM(CASE WHEN hc.http_reachable AND hc.websocket_connectable THEN 1 ELSE 0 END) as success,
  ROUND(AVG(hc.latency_ms)) as avg_latency_ms
FROM relays r
JOIN health_checks hc ON r.id = hc.relay_id
WHERE hc.checked_at > NOW() - INTERVAL '24 hours'
GROUP BY r.url;
```

## Migrations

```bash
# Generate migration from schema changes
bun run db:generate

# Run pending migrations
bun run db:migrate

# Push schema directly (dev only, no migration file)
bun run db:push

# Open Drizzle Studio (visual browser)
bun run db:studio
```
