import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { relayDiscovered, relayInfoSnapshots, relays } from './schema';

// ─── Prepared statements (JIT-compiled once, reused across all requests) ───

/** Look up a relay by ID. Used in GET /:id, PUT /:id, DELETE /:id, POST /:id/check, discover, popularity. */
export const getRelayById = db
  .select()
  .from(relays)
  .where(eq(relays.id, sql.placeholder('id')))
  .limit(1)
  .prepare('getRelayById');

/** Look up a relay by URL. Used in POST / (check for duplicates). */
export const getRelayByUrl = db
  .select()
  .from(relays)
  .where(eq(relays.url, sql.placeholder('url')))
  .limit(1)
  .prepare('getRelayByUrl');

/** Get latest NIP-11 info snapshot for a relay. Used in GET /:id. */
export const getLatestInfo = db
  .select()
  .from(relayInfoSnapshots)
  .where(eq(relayInfoSnapshots.relayId, sql.placeholder('relayId')))
  .orderBy(desc(relayInfoSnapshots.fetchedAt))
  .limit(1)
  .prepare('getLatestInfo');

/** Get NIP-11 snapshot history. Used in GET /:id/nip11. */
export const getNip11History = db
  .select()
  .from(relayInfoSnapshots)
  .where(eq(relayInfoSnapshots.relayId, sql.placeholder('relayId')))
  .orderBy(desc(relayInfoSnapshots.fetchedAt))
  .limit(sql.placeholder('limit'))
  .prepare('getNip11History');

/** Get NIP-66 discoveries for a relay URL. Used in discover and directory routes. */
export const getDiscoveriesByUrl = db
  .select()
  .from(relayDiscovered)
  .where(eq(relayDiscovered.relayUrl, sql.placeholder('relayUrl')))
  .orderBy(desc(relayDiscovered.discoveredAt))
  .limit(50)
  .prepare('getDiscoveriesByUrl');

/** Get latest NIP-66 discovery for a relay URL. Used in directory compare and ingestor. */
export const getLatestDiscovery = db
  .select()
  .from(relayDiscovered)
  .where(eq(relayDiscovered.relayUrl, sql.placeholder('relayUrl')))
  .orderBy(desc(relayDiscovered.discoveredAt))
  .limit(1)
  .prepare('getLatestDiscovery');
