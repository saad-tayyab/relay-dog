import type { LatencyMetrics } from '@relayscope/shared';

export function useLatencyMeasurement() {
  let metrics = $state<LatencyMetrics>({
    wsRoundTripMs: null,
    httpLatencyMs: null,
    eoseTimeMs: null,
    eoseEventCount: 0,
  });
  let measuring = $state(false);

  /**
   * Measure WebSocket round-trip latency by sending a REQ with limit:0
   * and timing how long until EOSE arrives.
   */
  async function measureWsLatency(url: string): Promise<number | null> {
    const start = performance.now();
    return new Promise<number | null>((resolve) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        ws.close();
        resolve(null);
      }, 10_000);

      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', 'latency-ping', { limit: 0 }]));
      };

      ws.onmessage = (event: MessageEvent) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (Array.isArray(parsed) && parsed[0] === 'EOSE' && parsed[1] === 'latency-ping') {
          clearTimeout(timeout);
          const latency = Math.round(performance.now() - start);
          ws.close();
          resolve(latency);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(null);
      };
    });
  }

  /**
   * Measure HTTP latency via NIP-11 fetch.
   */
  async function measureHttpLatency(url: string): Promise<number | null> {
    const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
    const start = performance.now();
    try {
      const res = await fetch(httpUrl, {
        headers: { Accept: 'application/nostr+json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        return Math.round(performance.now() - start);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Run all latency measurements for a relay.
   */
  async function measureAll(url: string): Promise<void> {
    if (measuring) return; // Concurrency guard
    measuring = true;
    try {
      const [wsMs, httpMs] = await Promise.all([measureWsLatency(url), measureHttpLatency(url)]);
      metrics = {
        ...metrics,
        wsRoundTripMs: wsMs,
        httpLatencyMs: httpMs,
      };
    } finally {
      measuring = false;
    }
  }

  /**
   * Set EOSE timing data (called from relaySocket when EOSE fires).
   */
  function setEoseTiming(timeMs: number, eventCount: number) {
    metrics = { ...metrics, eoseTimeMs: timeMs, eoseEventCount: eventCount };
  }

  function reset() {
    metrics = {
      wsRoundTripMs: null,
      httpLatencyMs: null,
      eoseTimeMs: null,
      eoseEventCount: 0,
    };
    measuring = false;
  }

  return {
    get metrics() {
      return metrics;
    },
    get measuring() {
      return measuring;
    },
    measureAll,
    measureWsLatency,
    measureHttpLatency,
    setEoseTiming,
    reset,
  };
}
