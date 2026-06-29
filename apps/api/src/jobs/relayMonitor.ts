import { db } from '../db'
import { relays, relayInfoSnapshots, healthChecks, monitoringJobs } from '../db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'

// ─── Health Check Logic ───

async function checkRelayHealth(url: string) {
  const httpUrl = url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://').replace(/\/$/, '')
  const wsUrl = url.startsWith('http')
    ? url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    : url

  let httpReachable = false
  let corsConfigured = false
  let websocketConnectable = false
  let latencyMs: number | null = null
  let httpStatusCode: number | null = null
  let errorMessage: string | null = null

  // HTTP check
  try {
    const start = performance.now()
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      signal: AbortSignal.timeout(10000),
    })
    latencyMs = Math.round(performance.now() - start)
    httpReachable = res.ok
    httpStatusCode = res.status
    corsConfigured = true

    // Also refresh NIP-11 data if reachable
    if (res.ok) {
      try {
        const nip11 = await res.json()
        return { httpReachable, corsConfigured, websocketConnectable, latencyMs, httpStatusCode, errorMessage, nip11 }
      } catch {
        // NIP-11 parse failed
      }
    }
  } catch (e: unknown) {
    errorMessage = e instanceof Error ? e.message : 'HTTP check failed'
  }

  // WebSocket check
  try {
    const ws = new WebSocket(wsUrl)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket timeout'))
      }, 5000)
      ws.onopen = () => {
        clearTimeout(timeout)
        websocketConnectable = true
        ws.close()
        resolve()
      }
      ws.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('WebSocket error'))
      }
    })
  } catch (e: unknown) {
    if (!errorMessage) errorMessage = e instanceof Error ? e.message : 'WebSocket check failed'
  }

  return { httpReachable, corsConfigured, websocketConnectable, latencyMs, httpStatusCode, errorMessage, nip11: null }
}

// ─── Monitor a Single Relay ───

async function monitorRelay(relayId: string, url: string) {
  console.log(`[monitor] Checking relay: ${url}`)

  const result = await checkRelayHealth(url)

  // Store health check
  await db.insert(healthChecks).values({
    relayId,
    httpReachable: result.httpReachable,
    corsConfigured: result.corsConfigured,
    websocketConnectable: result.websocketConnectable,
    latencyMs: result.latencyMs,
    httpStatusCode: result.httpStatusCode,
    errorMessage: result.errorMessage,
  })

  // Update NIP-11 info if we got new data
  if (result.nip11 && typeof result.nip11 === 'object') {
    const nip11 = result.nip11 as Record<string, unknown>

    await db.insert(relayInfoSnapshots).values({
      relayId,
      nip11,
      rawJson: nip11,
    })

    // Update relay record with latest info
    await db.update(relays).set({
      name: (nip11.name as string) || null,
      description: (nip11.description as string) || null,
      icon: (nip11.icon as string) || null,
      software: (nip11.software as string) || null,
      version: (nip11.version as string) || null,
      supportedNips: (nip11.supported_nips as number[]) || [],
      limitations: (nip11.limitation as Record<string, unknown>) || null,
      updatedAt: new Date(),
    }).where(eq(relays.id, relayId))
  }

  // Update job timestamps
  await db.update(monitoringJobs).set({
    lastRunAt: new Date(),
    nextRunAt: new Date(Date.now() + 60000), // Default 1 min interval
  }).where(eq(monitoringJobs.relayId, relayId))

  console.log(`[monitor] ${url}: HTTP=${result.httpReachable} WS=${result.websocketConnectable} latency=${result.latencyMs}ms`)
}

// ─── Scheduler Loop ───

let isRunning = false

async function runMonitoringCycle() {
  if (isRunning) {
    console.log('[monitor] Previous cycle still running, skipping...')
    return
  }

  isRunning = true
  console.log('[monitor] Starting monitoring cycle...')

  try {
    // Find all enabled jobs that are due
    const now = new Date()
    const dueJobs = await db
      .select({
        job: monitoringJobs,
        relay: relays,
      })
      .from(monitoringJobs)
      .innerJoin(relays, eq(monitoringJobs.relayId, relays.id))
      .where(
        and(
          eq(monitoringJobs.enabled, true),
          sql`(${monitoringJobs.nextRunAt} IS NULL OR ${monitoringJobs.nextRunAt} <= ${now})`
        )
      )

    console.log(`[monitor] Found ${dueJobs.length} due jobs`)

    // Process each job (sequentially to avoid hammering)
    for (const { job, relay } of dueJobs) {
      try {
        await monitorRelay(job.relayId, relay.url)
      } catch (e) {
        console.error(`[monitor] Error monitoring ${relay.url}:`, e)
      }
    }
  } catch (e) {
    console.error('[monitor] Error in monitoring cycle:', e)
  } finally {
    isRunning = false
  }
}

// ─── Public API ───

export function startMonitor(intervalMs = 30_000) {
  console.log(`[monitor] Starting relay monitor (interval: ${intervalMs}ms)`)

  // Run immediately
  runMonitoringCycle()

  // Then on interval
  const timer = setInterval(runMonitoringCycle, intervalMs)

  return {
    stop: () => {
      clearInterval(timer)
      console.log('[monitor] Monitor stopped')
    },
    runOnce: runMonitoringCycle,
  }
}

export { monitorRelay, checkRelayHealth }
