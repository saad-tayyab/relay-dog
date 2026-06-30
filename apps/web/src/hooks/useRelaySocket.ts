import type { NostrEvent } from '@relayscope/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface EoseState {
  received: boolean;
  historicalCount: number;
  liveCount: number;
}

export interface UseRelaySocketReturn {
  status: ConnectionStatus;
  events: NostrEvent[];
  send: (message: string) => void;
  connect: () => void;
  disconnect: () => void;
  eose: EoseState;
  notices: string[];
  error: string | null;
}

const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const BACKOFF_MULTIPLIER = 2;
const CONNECTION_TIMEOUT_MS = 10_000;

export function useRelaySocket(relayUrl: string): UseRelaySocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [eose, setEose] = useState<EoseState>({
    received: false,
    historicalCount: 0,
    liveCount: 0,
  });
  const [notices, setNotices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(INITIAL_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectEnabledRef = useRef(false);
  const eventIdsRef = useRef<Set<string>>(new Set());
  const eoseReceivedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  // Store connect in ref so scheduleReconnect can call it without being a dep
  const scheduleReconnect = useCallback(() => {
    if (!reconnectEnabledRef.current) return;

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current();
    }, backoffRef.current);

    backoffRef.current = Math.min(backoffRef.current * BACKOFF_MULTIPLIER, MAX_DELAY_MS);
  }, []);

  const disconnect = useCallback(() => {
    reconnectEnabledRef.current = false;
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setError(null);
  }, []);

  const connect = useCallback(() => {
    // Don't connect without a URL or if already connected/connecting
    if (!relayUrl || status === 'connected' || status === 'connecting') return;

    reconnectEnabledRef.current = true;
    setError(null);
    setStatus('connecting');

    // Clean up existing socket
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(relayUrl);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create WebSocket';
      setError(message);
      setStatus('error');
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    // Connection timeout via setTimeout
    const timeoutId = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        setError('Connection timed out');
        setStatus('error');
        scheduleReconnect();
      }
    }, CONNECTION_TIMEOUT_MS);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      setStatus('connected');
      setError(null);
      backoffRef.current = INITIAL_DELAY_MS;
    };

    ws.onmessage = (event: MessageEvent) => {
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

        if (eventIdsRef.current.has(nostrEvent.id)) return;
        eventIdsRef.current.add(nostrEvent.id);

        setEvents((prev) => [...prev, nostrEvent]);

        if (!eoseReceivedRef.current) {
          setEose((prev) => ({
            ...prev,
            historicalCount: prev.historicalCount + 1,
          }));
        } else {
          setEose((prev) => ({
            ...prev,
            liveCount: prev.liveCount + 1,
          }));
        }
      } else if (messageType === 'EOSE') {
        eoseReceivedRef.current = true;
        setEose((prev) => ({ ...prev, received: true }));
      } else if (messageType === 'NOTICE') {
        const noticeMessage = parsed[1] as string;
        if (typeof noticeMessage === 'string') {
          setNotices((prev) => [...prev, noticeMessage]);
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      setError('WebSocket connection error');
      setStatus('error');
    };

    ws.onclose = () => {
      clearTimeout(timeoutId);
      wsRef.current = null;
      if (reconnectEnabledRef.current && status !== 'disconnected') {
        setStatus('disconnected');
        scheduleReconnect();
      }
    };
  }, [relayUrl, status, scheduleReconnect]);

  // Keep connectRef in sync
  connectRef.current = connect;

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  // Reset state on mount (cleanup on unmount handled by effect return)
  useEffect(() => {
    setStatus('disconnected');
    setEvents([]);
    setEose({ received: false, historicalCount: 0, liveCount: 0 });
    setNotices([]);
    setError(null);
    eventIdsRef.current.clear();
    eoseReceivedRef.current = false;
    backoffRef.current = INITIAL_DELAY_MS;
    reconnectEnabledRef.current = false;

    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reconnectEnabledRef.current = false;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { status, events, send, connect, disconnect, eose, notices, error };
}
