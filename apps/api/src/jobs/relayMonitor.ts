import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { healthChecks, relayInfoSnapshots, relays } from '../db/schema';
import { categorizeError } from '../lib/errors';
import { assertSafeUrl, assertSafeUrlResolved } from '../lib/ssrf';

async function toHttpUrl(url: string): Promise<string> {
  const httpUrl = url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
  await assertSafeUrlResolved(httpUrl);
  return httpUrl;
}

function toWsUrl(url: string): string {
  const wsUrl = url.startsWith('http')
    ? url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    : url;
  assertSafeUrl(wsUrl);
  return wsUrl;
}

async function checkRelayHealth(url: string) {
  let httpUrl: string;
  let wsUrl: string;

  try {
    httpUrl = await toHttpUrl(url);
    wsUrl = toWsUrl(url);
  } catch {
    return {
      httpReachable: false,
      corsConfigured: false,
      websocketConnectable: false,
      latencyMs: null,
      httpStatusCode: null,
      errorMessage: 'invalid_target',
      nip11: null,
    };
  }

  let httpReachable = false;
  let corsConfigured = false;
  let websocketConnectable = false;
  let latencyMs: number | null = null;
  let httpStatusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const start = performance.now();
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      signal: AbortSignal.timeout(10000),
    });
    latencyMs = Math.round(performance.now() - start);
    httpReachable = res.ok;
    httpStatusCode = res.status;
    corsConfigured = true;

    if (res.ok) {
      try {
        const nip11 = await res.json();
        return {
          httpReachable,
          corsConfigured,
          websocketConnectable,
          latencyMs,
          httpStatusCode,
          errorMessage,
          nip11,
        };
      } catch {
        // NIP-11 parse failed
      }
    }
  } catch (e: unknown) {
    errorMessage = categorizeError(e);
  }

  try {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 5000);
      ws.onopen = () => {
        clearTimeout(timeout);
        websocketConnectable = true;
        ws.close();
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  } catch (e: unknown) {
    if (!errorMessage) errorMessage = categorizeError(e);
  }

  return {
    httpReachable,
    corsConfigured,
    websocketConnectable,
    latencyMs,
    httpStatusCode,
    errorMessage,
    nip11: null,
  };
}

async function monitorRelay(relayId: string, url: string) {
  const result = await checkRelayHealth(url);

  await db.insert(healthChecks).values({
    relayId,
    httpReachable: result.httpReachable,
    corsConfigured: result.corsConfigured,
    websocketConnectable: result.websocketConnectable,
    latencyMs: result.latencyMs,
    httpStatusCode: result.httpStatusCode,
    errorMessage: result.errorMessage,
  });

  if (result.nip11 && typeof result.nip11 === 'object') {
    const nip11 = result.nip11 as Record<string, unknown>;

    await db.insert(relayInfoSnapshots).values({
      relayId,
      nip11,
      rawJson: nip11,
    });

    await db
      .update(relays)
      .set({
        name: (nip11.name as string) || null,
        description: (nip11.description as string) || null,
        icon: (nip11.icon as string) || null,
        software: (nip11.software as string) || null,
        version: (nip11.version as string) || null,
        supportedNips: (nip11.supported_nips as number[]) || [],
        limitations: (nip11.limitation as Record<string, unknown>) || null,
        updatedAt: new Date(),
      })
      .where(eq(relays.id, relayId));
  }

  await db.update(relays).set({ updatedAt: new Date() }).where(eq(relays.id, relayId));
}

// ─── Data Retention Cleanup ───

let lastRetentionRun: Date | null = null;

function shouldRunRetention(): boolean {
  if (!lastRetentionRun) return true;
  const hoursSinceLastRun = (Date.now() - lastRetentionRun.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastRun >= 24;
}

async function runRetentionCleanup() {
  try {
    // Health checks: keep 90 days
    await db.execute(sql`DELETE FROM health_checks WHERE checked_at < NOW() - INTERVAL '90 days'`);

    // Relay events: keep 30 days
    await db.execute(sql`DELETE FROM relay_events WHERE received_at < NOW() - INTERVAL '30 days'`);

    // NIP-11 snapshots: keep 180 days
    await db.execute(
      sql`DELETE FROM relay_info_snapshots WHERE fetched_at < NOW() - INTERVAL '180 days'`,
    );

    // Discovery data: keep 180 days
    await db.execute(
      sql`DELETE FROM relay_discoveries WHERE discovered_at < NOW() - INTERVAL '180 days'`,
    );

    lastRetentionRun = new Date();
  } catch {
    // Retention cleanup failed — non-critical, log and continue
    process.stderr.write(
      `${JSON.stringify({
        level: 'error',
        msg: 'Data retention cleanup failed',
        timestamp: new Date().toISOString(),
      })}\n`,
    );
  }
}

// ─── Monitoring Cycle ───

let isRunning = false;

async function runMonitoringCycle() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    // Check all relays directly — no dependency on monitoringJobs table
    const allRelays = await db.select().from(relays);

    for (const relay of allRelays) {
      try {
        await monitorRelay(relay.id, relay.url);
      } catch {
        // Relay check failed — logged via health check record
      }
    }

    // Run retention cleanup once per day
    if (shouldRunRetention()) {
      await runRetentionCleanup();
    }
  } catch {
    // Monitoring cycle failed — will retry on next interval
  } finally {
    isRunning = false;
  }
}

export function startMonitor(intervalMs = 30_000) {
  runMonitoringCycle();
  const timer = setInterval(runMonitoringCycle, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
    },
    runOnce: runMonitoringCycle,
  };
}

export { checkRelayHealth, monitorRelay };
