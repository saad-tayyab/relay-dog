import { apiFetch } from '../../utils/api';
import type { ConnectionStatus, RelayInfo } from '../../utils/relay';
import { checkConnections, fetchNip11, normalizeUrl } from '../../utils/relay';
import { relaySocket } from '../stores/relaySocket.svelte';
import { useLatencyMeasurement } from './useLatencyMeasurement.svelte';
import { useToast } from './useToast.svelte';
import { useWriteTest } from './useWriteTest.svelte';

/**
 * Composable that owns all relay inspection state and data fetching logic.
 * Extracted from App.svelte to decouple inspection concerns from layout.
 */
export function useRelayInspector() {
  let url = $state('');
  let relayInfo = $state<RelayInfo | null>(null);
  let connectionStatus = $state<ConnectionStatus | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let dbRelayId = $state<string | null>(null);
  let inDirectory = $state(false);

  const normalizedUrl = $derived(normalizeUrl(url));
  const socket = relaySocket(() => normalizedUrl);

  const latency = useLatencyMeasurement();
  const writeTest = useWriteTest();
  const toast = useToast();

  async function handleFetch(targetUrl?: string) {
    const inputUrl = targetUrl || url;
    const normalized = normalizeUrl(inputUrl);
    if (!normalized) return;

    loading = true;
    error = null;
    relayInfo = null;
    connectionStatus = null;
    dbRelayId = null;
    inDirectory = false;
    toast.hide();
    latency.reset();
    writeTest.reset();

    try {
      const [infoResult, connResult] = await Promise.allSettled([
        fetchNip11(normalized),
        checkConnections(normalized),
      ]);

      if (infoResult.status === 'fulfilled') {
        relayInfo = infoResult.value;
      } else {
        error =
          infoResult.reason instanceof Error
            ? infoResult.reason.message
            : 'Failed to fetch NIP-11 info';
      }

      if (connResult.status === 'fulfilled') {
        connectionStatus = connResult.value;
      }

      dbRelayId = null;
      inDirectory = false;
      try {
        const lookupRes = await apiFetch(
          `/api/relays/lookup?url=${encodeURIComponent(normalized)}`,
        );
        const lookupJson = await lookupRes.json();
        if (lookupJson.success && lookupJson.data) {
          dbRelayId = lookupJson.data.id;
          inDirectory = true;
        }
      } catch {
        // Not in DB or no backend
      }
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
    } finally {
      loading = false;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    handleFetch();
  }

  function handleQuickPick(relay: string) {
    url = relay;
    handleFetch(relay);
  }

  function handleInDirectoryChange(inDir: boolean, relayId?: string, relayUrl?: string) {
    inDirectory = inDir;
    if (inDir && relayId && relayUrl) {
      toast.show({
        message: `"${relayUrl}" added to directory`,
        type: 'success',
        undoLabel: 'Undo',
        onUndo: () => {
          const headers: Record<string, string> = {};
          const savedKey = localStorage.getItem('relayscope_api_key');
          if (savedKey) {
            headers.Authorization = `Bearer ${savedKey}`;
          }
          apiFetch(`/api/relays/${relayId}`, {
            method: 'DELETE',
            headers,
            signal: AbortSignal.timeout(10_000),
          })
            .then(() => {
              inDirectory = false;
            })
            .catch(() => {});
        },
      });
    }
  }

  return {
    get url() {
      return url;
    },
    set url(v: string) {
      url = v;
    },
    get normalizedUrl() {
      return normalizedUrl;
    },
    get relayInfo() {
      return relayInfo;
    },
    get connectionStatus() {
      return connectionStatus;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get dbRelayId() {
      return dbRelayId;
    },
    get inDirectory() {
      return inDirectory;
    },
    socket,
    latency,
    writeTest,
    toast,
    handleFetch,
    handleSubmit,
    handleQuickPick,
    handleInDirectoryChange,
  };
}
