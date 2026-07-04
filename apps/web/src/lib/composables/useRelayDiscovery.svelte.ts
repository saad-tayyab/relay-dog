import type { RelayDiscovery } from '@relayscope/shared';
import { apiUrl } from '../../utils/api';

const API_BASE = apiUrl('/api/relays');

export function useRelayDiscovery() {
  let discoveries = $state<RelayDiscovery[]>([]);
  let stats = $state<{
    monitorCount: number;
    avgRttOpen: number | null;
    avgRttRead: number | null;
    avgRttWrite: number | null;
  } | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function fetchDiscoveries(relayId: string): Promise<void> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${API_BASE}/${relayId}/discoveries`, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch discoveries');
      }

      discoveries = json.data.discoveries;
      stats = json.data.stats;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to fetch discoveries';
    } finally {
      loading = false;
    }
  }

  function reset() {
    discoveries = [];
    stats = null;
    loading = false;
    error = null;
  }

  return {
    get discoveries() {
      return discoveries;
    },
    get stats() {
      return stats;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    fetchDiscoveries,
    reset,
  };
}
