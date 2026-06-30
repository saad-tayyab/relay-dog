import { defineRelations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
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
    banner: text('banner'),
    pubkey: text('pubkey'),
    self: text('self'),
    contact: text('contact'),
    termsOfService: text('terms_of_service'),
    paymentsUrl: text('payments_url'),
    fees: jsonb('fees'),
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
    nip67EoseHints: jsonb('nip67_eose_hints'),
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

// ─── Relay Discoveries (NIP-66) ───
export const relayDiscovered = pgTable(
  'relay_discoveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    relayUrl: text('relay_url').notNull(),
    monitorPubkey: text('monitor_pubkey').notNull(),
    rttOpen: integer('rtt_open'),
    rttRead: integer('rtt_read'),
    rttWrite: integer('rtt_write'),
    networkType: text('network_type'),
    relayType: text('relay_type'),
    supportedNips: integer('supported_nips').array().default([]),
    requirements: text('requirements').array().default([]),
    topics: text('topics').array().default([]),
    geohash: text('geohash'),
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('relay_discoveries_url_monitor_key').on(t.relayUrl, t.monitorPubkey)],
);

// ─── Relay List Entries (NIP-65) ───
export const relayListEntries = pgTable(
  'relay_list_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorPubkey: text('author_pubkey').notNull(),
    relayUrl: text('relay_url').notNull(),
    marker: text('marker'),
    listedAt: timestamp('listed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('relay_list_entries_author_relay_key').on(t.authorPubkey, t.relayUrl)],
);

// ─── Relations ───

export const relations = defineRelations(
  {
    relays,
    relayInfoSnapshots,
    healthChecks,
    relayEvents,
    monitoringJobs,
    relayDiscovered,
    relayListEntries,
  },
  (r) => ({
    relays: {
      infoSnapshots: r.many.relayInfoSnapshots(),
      healthChecks: r.many.healthChecks(),
      events: r.many.relayEvents(),
      monitoringJob: r.one.monitoringJobs(),
    },
    relayInfoSnapshots: {
      relay: r.one.relays({
        from: r.relayInfoSnapshots.relayId,
        to: r.relays.id,
      }),
    },
    healthChecks: {
      relay: r.one.relays({
        from: r.healthChecks.relayId,
        to: r.relays.id,
      }),
    },
    relayEvents: {
      relay: r.one.relays({
        from: r.relayEvents.relayId,
        to: r.relays.id,
      }),
    },
    monitoringJobs: {
      relay: r.one.relays({
        from: r.monitoringJobs.relayId,
        to: r.relays.id,
      }),
    },
  }),
);

// ─── Type exports for use in routes ───
export type Relay = typeof relays.$inferSelect;
export type NewRelay = typeof relays.$inferInsert;
export type RelayInfoSnapshot = typeof relayInfoSnapshots.$inferSelect;
export type HealthCheck = typeof healthChecks.$inferSelect;
export type RelayEvent = typeof relayEvents.$inferSelect;
export type MonitoringJob = typeof monitoringJobs.$inferSelect;
export type RelayDiscovery = typeof relayDiscovered.$inferSelect;
export type RelayListEntry = typeof relayListEntries.$inferSelect;
