import type { NostrEvent } from '@relayscope/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface EoseState {
  received: boolean;
  historicalCount: number;
  liveCount: number;
}

const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;
const CONNECTION_TIMEOUT_MS = 10_000;

export function relaySocket(getRelayUrl: () => string) {
  // ─── Reactive State (Svelte 5 Runes) ───
  let status = $state<ConnectionStatus>('disconnected');
  let events = $state<NostrEvent[]>([]);
  let eose = $state<EoseState>({
    received: false,
    historicalCount: 0,
    liveCount: 0,
  });
  let notices = $state<string[]>([]);
  let error = $state<string | null>(null);

  // ─── Non-reactive Refs ───
  let ws: WebSocket | null = null;
  let backoff = INITIAL_DELAY_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectEnabled = false;
  const eventIds = new Set<string>();
  let eoseReceived = false;

  // ─── Internal Helpers ───

  function scheduleReconnect() {
    if (!reconnectEnabled) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, backoff);
    backoff = Math.min(backoff * BACKOFF_MULTIPLIER, MAX_DELAY_MS);
  }

  function resetState() {
    status = 'disconnected';
    events = [];
    eose = { received: false, historicalCount: 0, liveCount: 0 };
    notices = [];
    error = null;
    eventIds.clear();
    eoseReceived = false;
    backoff = INITIAL_DELAY_MS;
  }

  // ─── Public API ───

  function connect() {
    const url = getRelayUrl();
    if (!url || status === 'connected' || status === 'connecting') return;

    reconnectEnabled = true;
    error = null;
    status = 'connecting';

    // Clean up existing socket
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to create WebSocket';
      status = 'error';
      scheduleReconnect();
      return;
    }
    ws = socket;

    const timeoutId = setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.close();
        error = 'Connection timed out';
        status = 'error';
        scheduleReconnect();
      }
    }, CONNECTION_TIMEOUT_MS);

    socket.onopen = () => {
      clearTimeout(timeoutId);
      status = 'connected';
      error = null;
      backoff = INITIAL_DELAY_MS;
    };

    socket.onmessage = (event: MessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (!Array.isArray(parsed) || parsed.length < 2) return;

      const messageType = parsed[0] as string;

      if (messageType === 'EVENT') {
        const nostrEvent = parsed[2] as NostrEvent | undefined;
        if (!nostrEvent?.id) return;

        // Deduplicate
        if (eventIds.has(nostrEvent.id)) return;
        eventIds.add(nostrEvent.id);

        // Append to reactive array
        events = [...events, nostrEvent];

        if (!eoseReceived) {
          eose = { ...eose, historicalCount: eose.historicalCount + 1 };
        } else {
          eose = { ...eose, liveCount: eose.liveCount + 1 };
        }
      } else if (messageType === 'EOSE') {
        eoseReceived = true;
        eose = { ...eose, received: true };
      } else if (messageType === 'NOTICE') {
        const noticeMessage = parsed[1] as string;
        if (typeof noticeMessage === 'string') {
          notices = [...notices, noticeMessage];
        }
      }
    };

    socket.onerror = () => {
      clearTimeout(timeoutId);
      error = 'WebSocket connection error';
      status = 'error';
    };

    socket.onclose = () => {
      clearTimeout(timeoutId);
      ws = null;
      if (reconnectEnabled && status !== 'disconnected') {
        status = 'disconnected';
        scheduleReconnect();
      }
    };
  }

  function disconnect() {
    reconnectEnabled = false;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    status = 'disconnected';
    error = null;
  }

  function send(message: string) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }

  // ─── Lifecycle: Reset on URL change or unmount ───

  $effect(() => {
    // Track URL via getter — re-runs when normalizedUrl changes
    const _url = getRelayUrl();

    // Cleanup previous connection
    reconnectEnabled = false;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }

    resetState();

    return () => {
      // Cleanup on unmount
      reconnectEnabled = false;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  });

  // ─── Return reactive interface (getter-based for automatic tracking) ───

  return {
    get status() {
      return status;
    },
    get events() {
      return events;
    },
    get eose() {
      return eose;
    },
    get notices() {
      return notices;
    },
    get error() {
      return error;
    },
    connect,
    disconnect,
    send,
  };
}
