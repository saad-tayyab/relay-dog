import type { WriteTestResult } from '@relayscope/shared';

const TEST_EVENT_KIND = 27676;
const TEST_EVENT_CONTENT = 'Relay Dog write test — this event can be safely ignored.';

export function useWriteTest() {
  let result = $state<WriteTestResult>({
    status: 'idle',
    latencyMs: null,
    error: null,
    eventId: null,
  });

  async function runTest(url: string): Promise<WriteTestResult> {
    result = { status: 'testing', latencyMs: null, error: null, eventId: null };

    if (!window.nostr) {
      result = {
        status: 'failed',
        latencyMs: null,
        error: 'No NIP-07 extension detected. Install a Nostr browser extension.',
        eventId: null,
      };
      return result;
    }

    try {
      // Call getPublicKey() to verify extension is available
      await window.nostr.getPublicKey();
      const now = Math.floor(Date.now() / 1000);

      const start = performance.now();

      const signedEvent = await window.nostr.signEvent({
        kind: TEST_EVENT_KIND,
        content: TEST_EVENT_CONTENT,
        tags: [],
        created_at: now,
      });

      // Send via WebSocket
      const latency = await new Promise<number>((resolve, reject) => {
        let ws: WebSocket;
        try {
          ws = new WebSocket(url);
        } catch (e: unknown) {
          reject(e instanceof Error ? e : new Error('Failed to create WebSocket'));
          return;
        }

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout waiting for OK response'));
        }, 10_000);

        ws.onopen = () => {
          ws.send(JSON.stringify(['EVENT', signedEvent]));
        };

        ws.onmessage = (event: MessageEvent) => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(String(event.data));
          } catch {
            return;
          }
          if (Array.isArray(parsed) && parsed[0] === 'OK') {
            clearTimeout(timeout);
            const elapsed = Math.round(performance.now() - start);
            ws.close();
            resolve(elapsed);
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket error during write test'));
        };
      });

      result = {
        status: 'success',
        latencyMs: latency,
        error: null,
        eventId: signedEvent.id,
      };
    } catch (e: unknown) {
      result = {
        status: 'failed',
        latencyMs: null,
        error: e instanceof Error ? e.message : 'Unknown error',
        eventId: null,
      };
    }

    return result;
  }

  function reset() {
    result = { status: 'idle', latencyMs: null, error: null, eventId: null };
  }

  return {
    get status() {
      return result.status;
    },
    get latencyMs() {
      return result.latencyMs;
    },
    get error() {
      return result.error;
    },
    get eventId() {
      return result.eventId;
    },
    runTest,
    reset,
  };
}
