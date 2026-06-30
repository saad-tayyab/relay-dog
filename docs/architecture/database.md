# 🗄️ Database Schema

Relay Scope uses **PostgreSQL** with **Drizzle ORM**. The schema defines 7 tables for tracking relays, their info, health status, events, monitoring jobs, NIP-66 discoveries, and NIP-65 relay lists.

## Entity Relationship Diagram

```mermaid
erDiagram
    relays ||--o{ relay_info_snapshots : "has NIP-11 history"
    relays ||--o{ health_checks : "has health history"
    relays ||--o{ relay_events : "captures events"
    relays ||--o| monitoring_jobs : "scheduled checks"
    relays ||--o{ relay_discoveries : "NIP-66 monitor data"
    relays ||--o{ relay_list_entries : "NIP-65 relay lists"

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
        text banner
        text pubkey
        text self
        text contact
        text terms_of_service
        text payments_url
        jsonb fees
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
        jsonb nip67_eose_hints
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

    relay_discoveries {
        uuid id PK
        text relay_url
        text monitor_pubkey
        integer rtt_open
        integer rtt_read
        integer rtt_write
        text network_type
        text relay_type
        integer[] supported_nips
        text[] requirements
        text[] topics
        text geohash
        timestamp discovered_at
    }

    relay_list_entries {
        uuid id PK
        text author_pubkey
        text relay_url
        text marker
        timestamp listed_at
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
| `banner` | `text` | ✅ | Relay banner image URL (NIP-11) |
| `pubkey` | `text` | ✅ | Admin contact pubkey (32-byte hex, NIP-11) |
| `self` | `text` | ✅ | Relay's own identity pubkey (NIP-11) |
| `contact` | `text` | ✅ | Contact URI — mailto, https (NIP-11) |
| `terms_of_service` | `text` | ✅ | Link to ToS document (NIP-11) |
| `payments_url` | `text` | ✅ | Payment portal URL (NIP-11) |
| `fees` | `jsonb` | ✅ | Structured fee schedule — `RelayFees` (NIP-11) |

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
| `error_message` | `text` | ✅ | Categorized error — `timeout`, `connection_refused`, `dns_error`, `tls_error`, `invalid_target`, `websocket_error` |
| `checked_at` | `timestamptz` | NOT NULL | When this check was performed |
| `nip67_eose_hints` | `jsonb` | ✅ | NIP-67 EOSE completeness hints (`EoseResult`) |

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

### `relay_discoveries`

NIP-66 relay discovery data from monitor observations. One row per (relay_url, monitor_pubkey) pair.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `relay_url` | `text` | NOT NULL | Discovered relay URL |
| `monitor_pubkey` | `text` | NOT NULL | Monitor's public key (hex) |
| `rtt_open` | `integer` | ✅ | Round-trip time to open (ms) |
| `rtt_read` | `integer` | ✅ | Round-trip time to read (ms) |
| `rtt_write` | `integer` | ✅ | Round-trip time to write (ms) |
| `network_type` | `text` | ✅ | Network type — `clearnet`, `tor`, `i2p`, `loki` |
| `relay_type` | `text` | ✅ | Relay type (PascalCase enum) |
| `supported_nips` | `integer[]` | ✅ | NIPs observed by this monitor |
| `requirements` | `text[]` | ✅ | Requirements — `auth`, `!payment`, `pow` |
| `topics` | `text[]` | ✅ | Topic tags from discovery event |
| `geohash` | `text` | ✅ | Geographic geohash |
| `discovered_at` | `timestamptz` | NOT NULL | When this observation was recorded |

**Constraints**: `UNIQUE(relay_url, monitor_pubkey)`

### `relay_list_entries`

NIP-65 relay list entries tracking which relays users list for read/write. One row per (author_pubkey, relay_url) pair.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | PK | Auto-generated UUID |
| `author_pubkey` | `text` | NOT NULL | Author's public key (hex) |
| `relay_url` | `text` | NOT NULL | Listed relay URL |
| `marker` | `text` | ✅ | `read`, `write`, or NULL (both) |
| `listed_at` | `timestamptz` | NOT NULL | When this listing was recorded |

**Constraints**: `UNIQUE(author_pubkey, relay_url)`

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

### Relay popularity (NIP-65)

```sql
SELECT
  r.url,
  COUNT(CASE WHEN rle.marker = 'read' OR rle.marker IS NULL THEN 1 END) as read_count,
  COUNT(CASE WHEN rle.marker = 'write' OR rle.marker IS NULL THEN 1 END) as write_count
FROM relays r
LEFT JOIN relay_list_entries rle ON r.url = rle.relay_url
GROUP BY r.url;
```

### Monitor observations for a relay (NIP-66)

```sql
SELECT rd.*, COUNT(DISTINCT rd.monitor_pubkey) as monitor_count
FROM relay_discoveries rd
WHERE rd.relay_url = 'wss://relay.example.com'
GROUP BY rd.id
ORDER BY rd.discovered_at DESC;
```

## Data Retention

Unbounded table growth is prevented by a daily cron job:

| Table | Retention | Rationale |
|-------|-----------|-----------|
| `health_checks` | 90 days | Operational data, not historical analytics |
| `relay_events` | 30 days | Captured events are ephemeral debug data |
| `relay_info_snapshots` | 180 days | NIP-11 changes are infrequent, keep longer |

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

---

*Last updated: v0.9.0 — 2026-07-01*
