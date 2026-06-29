import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Relays ───
export const relays = pgTable(
  'relays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(),
    name: text('name'),
    description: text('description'),
    icon: text('icon'),
    software: text('software'),
    version: text('version'),
    supportedNips: integer('supported_nips').array().default([]),
    limitations: jsonb('limitations'),
    country: text('country'),
    isPublic: boolean('is_public').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('relays_url_idx').on(table.url),
    index('relays_nips_idx').on(table.supportedNips),
  ],
);

// ─── Relay Info Snapshots (NIP-11 history) ───
export const relayInfoSnapshots = pgTable(
  'relay_info_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    relayId: uuid('relay_id')
      .notNull()
      .references(() => relays.id, { onDelete: 'cascade' }),
    nip11: jsonb('nip11').notNull(),
    rawJson: jsonb('raw_json').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('relay_info_relay_id_idx').on(table.relayId),
    index('relay_info_fetched_at_idx').on(table.fetchedAt),
  ],
);

// ─── Health Checks ───
export const healthChecks = pgTable(
  'health_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    relayId: uuid('relay_id')
      .notNull()
      .references(() => relays.id, { onDelete: 'cascade' }),
    httpReachable: boolean('http_reachable').notNull(),
    corsConfigured: boolean('cors_configured').notNull(),
    websocketConnectable: boolean('websocket_connectable').notNull(),
    latencyMs: integer('latency_ms'),
    httpStatusCode: integer('http_status_code'),
    errorMessage: text('error_message'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('health_checks_relay_id_idx').on(table.relayId),
    index('health_checks_checked_at_idx').on(table.checkedAt),
  ],
);

// ─── Relay Events (captured from WebSocket) ───
export const relayEvents = pgTable(
  'relay_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    relayId: uuid('relay_id')
      .notNull()
      .references(() => relays.id, { onDelete: 'cascade' }),
    nostrEventId: text('nostr_event_id').notNull(),
    pubkey: text('pubkey').notNull(),
    kind: integer('kind').notNull(),
    content: text('content'),
    tags: jsonb('tags').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('relay_events_relay_id_idx').on(table.relayId),
    index('relay_events_kind_idx').on(table.kind),
    index('relay_events_nostr_event_id_idx').on(table.nostrEventId),
    index('relay_events_created_at_idx').on(table.createdAt),
  ],
);

// ─── Monitoring Jobs ───
export const monitoringJobs = pgTable(
  'monitoring_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    relayId: uuid('relay_id')
      .notNull()
      .references(() => relays.id, { onDelete: 'cascade' })
      .unique(),
    enabled: boolean('enabled').default(true).notNull(),
    intervalMs: integer('interval_ms').default(60000).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('monitoring_jobs_enabled_idx').on(table.enabled)],
);

// ─── Type exports for use in routes ───
export type Relay = typeof relays.$inferSelect;
export type NewRelay = typeof relays.$inferInsert;
export type RelayInfoSnapshot = typeof relayInfoSnapshots.$inferSelect;
export type HealthCheck = typeof healthChecks.$inferSelect;
export type RelayEvent = typeof relayEvents.$inferSelect;
export type MonitoringJob = typeof monitoringJobs.$inferSelect;
