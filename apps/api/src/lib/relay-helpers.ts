import type { DirectoryRelay, RelayLimitation } from '@relayscope/shared';
import type { relayDiscovered, relays } from '../db/schema';

// ─── Type aliases ───
type RelayRow = typeof relays.$inferSelect;
type DiscoveryRow = typeof relayDiscovered.$inferSelect;

// ─── Map DB relay row to DirectoryRelay ───
export function toDirectoryRelay(row: RelayRow, discovery: DiscoveryRow | null): DirectoryRelay {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    description: row.description,
    icon: row.icon,
    software: row.software,
    version: row.version,
    supportedNips: row.supportedNips ?? [],
    limitations: (row.limitations as RelayLimitation | null) ?? null,
    country: row.country,
    isPublic: row.isPublic ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastDiscovery: discovery
      ? {
          rttOpen: discovery.rttOpen,
          rttRead: discovery.rttRead,
          rttWrite: discovery.rttWrite,
          networkType: discovery.networkType,
          discoveredAt: discovery.discoveredAt,
        }
      : null,
  };
}

// ─── Sort relays by latency (nulls last) ───
export function sortByLatency(
  relays: RelayRow[],
  discoveryMap: Map<string, DiscoveryRow>,
  order: 'asc' | 'desc' = 'asc',
): RelayRow[] {
  return [...relays].sort((a, b) => {
    const dA = discoveryMap.get(a.url);
    const dB = discoveryMap.get(b.url);
    const rttA = dA?.rttOpen ?? Number.MAX_SAFE_INTEGER;
    const rttB = dB?.rttOpen ?? Number.MAX_SAFE_INTEGER;
    return order === 'desc' ? rttB - rttA : rttA - rttB;
  });
}

// ─── Compute NIP diff between two relays ───
export function nipDiff(
  nipsA: number[],
  nipsB: number[],
): { nipsOnlyInA: number[]; nipsOnlyInB: number[]; sharedNips: number[] } {
  const setA = new Set(nipsA);
  const setB = new Set(nipsB);
  return {
    nipsOnlyInA: [...setA].filter((n) => !setB.has(n)),
    nipsOnlyInB: [...setB].filter((n) => !setA.has(n)),
    sharedNips: [...setA].filter((n) => setB.has(n)),
  };
}

// ─── Determine health winner (online if discovered within last 24h) ───
export function healthWinner(
  discoveryA: DiscoveryRow | null | undefined,
  discoveryB: DiscoveryRow | null | undefined,
): 'A' | 'B' | 'tie' {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isOnlineA = discoveryA != null && now - new Date(discoveryA.discoveredAt).getTime() < dayMs;
  const isOnlineB = discoveryB != null && now - new Date(discoveryB.discoveredAt).getTime() < dayMs;
  if (isOnlineA && !isOnlineB) return 'A';
  if (isOnlineB && !isOnlineA) return 'B';
  return 'tie';
}

// ─── Determine latency winner ───
export function latencyWinner(
  discoveryA: DiscoveryRow | null | undefined,
  discoveryB: DiscoveryRow | null | undefined,
): 'A' | 'B' | 'tie' {
  const latA = discoveryA?.rttOpen;
  const latB = discoveryB?.rttOpen;
  if (latA != null && latB != null) {
    if (latA < latB) return 'A';
    if (latB < latA) return 'B';
  } else if (latA != null) {
    return 'A';
  } else if (latB != null) {
    return 'B';
  }
  return 'tie';
}
