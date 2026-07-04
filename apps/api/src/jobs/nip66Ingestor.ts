import { db } from '@relayscope/database';
import {
  relayDiscovered,
  relayEvents,
  relayInfoSnapshots,
  relays,
} from '@relayscope/database/schema';
import { getServerEnv } from '@relayscope/env/server';
import { RelayDiscoverySchema } from '@relayscope/shared/schemas';
import { eq, lt } from 'drizzle-orm';
import { log } from '../lib/log';
import { assertSafeUrl } from '../lib/ssrf';

// ─── Known NIP-66 Monitor Relays ───

const DEFAULT_MONITOR_RELAYS = ['wss://relay-monitor.migalmoreno.com'];

// ─── Tag Parsing ───

interface ParsedDiscovery {
  relayUrl: string;
  rttOpen: number | null;
  rttRead: number | null;
  rttWrite: number | null;
  networkType: string | null;
  relayType: string | null;
  supportedNips: number[];
  requirements: string[];
  topics: string[];
  geohash: string | null;
}

function parseRtt(tags: string[][], key: string): number | null {
  for (const tag of tags) {
    if (tag[0] === key && tag[1]) {
      const ms = Number.parseInt(tag[1], 10);
      if (!Number.isNaN(ms) && ms >= 0 && ms <= 120_000) return ms;
    }
  }
  return null;
}

function parseTags(tags: string[][]): ParsedDiscovery | null {
  let relayUrl: string | null = null;
  const rttOpen = parseRtt(tags, 'rtt-open');
  const rttRead = parseRtt(tags, 'rtt-read');
  const rttWrite = parseRtt(tags, 'rtt-write');
  const supportedNips: number[] = [];
  const requirements: string[] = [];
  const topics: string[] = [];
  let networkType: string | null = null;
  let relayType: string | null = null;
  let geohash: string | null = null;

  for (const tag of tags) {
    if (tag.length < 2) continue;
    const [key, value] = tag;

    switch (key) {
      case 'd':
        relayUrl = value;
        break;
      case 'n':
        networkType = value;
        break;
      case 'T':
        relayType = value;
        break;
      case 'N': {
        const nip = Number.parseInt(value, 10);
        if (!Number.isNaN(nip)) supportedNips.push(nip);
        break;
      }
      case 'R':
        requirements.push(value);
        break;
      case 't':
        topics.push(value);
        break;
      case 'g':
        geohash = value;
        break;
    }
  }

  if (!relayUrl) return null;

  return {
    relayUrl: relayUrl.replace(/\/+$/, ''),
    rttOpen,
    rttRead,
    rttWrite,
    networkType,
    relayType,
    supportedNips,
    requirements,
    topics,
    geohash,
  };
}

// ─── Ingestion ───

async function ingestDiscoveryEvent(event: unknown): Promise<void> {
  const parsed = RelayDiscoverySchema.safeParse(event);
  if (!parsed.success) return;

  const { pubkey, tags, created_at } = parsed.data;
  const discovery = parseTags(tags);
  if (!discovery) return;

  // SSRF check on the relay URL
  try {
    assertSafeUrl(discovery.relayUrl);
  } catch {
    return;
  }

  // Upsert into relay_discoveries
  await db
    .insert(relayDiscovered)
    .values({
      relayUrl: discovery.relayUrl,
      monitorPubkey: pubkey,
      rttOpen: discovery.rttOpen,
      rttRead: discovery.rttRead,
      rttWrite: discovery.rttWrite,
      networkType: discovery.networkType,
      relayType: discovery.relayType,
      supportedNips: discovery.supportedNips,
      requirements: discovery.requirements,
      topics: discovery.topics,
      geohash: discovery.geohash,
      discoveredAt: new Date(created_at * 1000),
    })
    .onConflictDoUpdate({
      target: [relayDiscovered.relayUrl, relayDiscovered.monitorPubkey],
      set: {
        rttOpen: discovery.rttOpen,
        rttRead: discovery.rttRead,
        rttWrite: discovery.rttWrite,
        networkType: discovery.networkType,
        relayType: discovery.relayType,
        supportedNips: discovery.supportedNips,
        requirements: discovery.requirements,
        topics: discovery.topics,
        geohash: discovery.geohash,
        discoveredAt: new Date(created_at * 1000),
      },
    });

  // Auto-create relay record if new
  const [existing] = await db
    .select({ id: relays.id })
    .from(relays)
    .where(eq(relays.url, discovery.relayUrl))
    .limit(1);

  if (!existing) {
    await db.insert(relays).values({ url: discovery.relayUrl });
  }
}

// ─── WebSocket Connection ───

function connectToMonitor(url: string): void {
  let reconnectDelay = 1000;

  function connect() {
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
    } catch {
      log({ level: 'error', msg: 'Failed to create WebSocket', url });
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      reconnectDelay = 1000;
      log({ level: 'info', msg: 'Connected to monitor relay', url });
      ws.send(JSON.stringify(['REQ', 'nip66-sub', { kinds: [30166] }]));
    };

    ws.onmessage = async (msg) => {
      try {
        const data = JSON.parse(String(msg.data));
        if (Array.isArray(data) && data[0] === 'EVENT' && data[2]?.kind === 30166) {
          await ingestDiscoveryEvent(data[2]);
        }
      } catch {
        // Non-critical: skip malformed messages
      }
    };

    ws.onerror = (err) => {
      log({ level: 'warn', msg: 'Monitor relay error', url, error: String(err) });
    };

    ws.onclose = () => {
      log({ level: 'warn', msg: 'Monitor relay disconnected', url });
      scheduleReconnect();
    };

    function scheduleReconnect() {
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        connect();
      }, reconnectDelay);
    }
  }

  connect();
}

// ─── Retention Cleanup ───

let lastRetentionRun: Date | null = null;

async function runRetentionCleanup(): Promise<void> {
  if (lastRetentionRun) {
    const hoursSince = (Date.now() - lastRetentionRun.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return;
  }

  try {
    const now = new Date();
    const days180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    await db.delete(relayInfoSnapshots).where(lt(relayInfoSnapshots.fetchedAt, days180));
    await db.delete(relayDiscovered).where(lt(relayDiscovered.discoveredAt, days180));
    await db.delete(relayEvents).where(lt(relayEvents.receivedAt, days30));

    lastRetentionRun = new Date();
    log({ level: 'info', msg: 'Retention cleanup completed' });
  } catch {
    log({ level: 'error', msg: 'Retention cleanup failed' });
  }
}

// ─── Entry Point ───

export function startNip66Ingestor(): void {
  const env = getServerEnv();
  const monitorUrls = env.MONITOR_RELAYS
    ? env.MONITOR_RELAYS.split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    : DEFAULT_MONITOR_RELAYS;

  log({ level: 'info', msg: 'Starting NIP-66 ingestor', monitors: monitorUrls });

  for (const url of monitorUrls) {
    connectToMonitor(url);
  }

  // Run retention cleanup once after 60s, then daily
  setTimeout(() => {
    runRetentionCleanup();
    setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
  }, 60_000);
}
