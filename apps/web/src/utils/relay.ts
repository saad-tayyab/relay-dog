// ─── URL Utilities ───

export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return '';
  if (
    !url.startsWith('wss://') &&
    !url.startsWith('ws://') &&
    !url.startsWith('https://') &&
    !url.startsWith('http://')
  ) {
    url = `wss://${url}`;
  }
  return url;
}

export function wsToHttp(url: string): string {
  return url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
}

export function httpToWs(url: string): string {
  return url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
}

// ─── NIP-11 Fetch ───

export interface RelayInfo {
  name?: string;
  description?: string;
  icon?: string;
  software?: string;
  version?: string;
  supported_nips?: number[];
  limitation?: Record<string, unknown>;
  posting_limit?: Record<string, unknown>;
  relay_limitation?: Record<string, unknown>;
  tags?: string[][];
  [key: string]: unknown;
}

export async function fetchNip11(url: string): Promise<RelayInfo> {
  const httpUrl = wsToHttp(url);
  const res = await fetch(httpUrl, {
    headers: { Accept: 'application/nostr+json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Connection Checks ───

export type CheckStatus = 'pending' | 'success' | 'error' | 'checking';

export interface ConnectionStatus {
  http: CheckStatus;
  cors: CheckStatus;
  websocket: CheckStatus;
  httpDetail?: string;
  corsDetail?: string;
  wsDetail?: string;
  latencyMs?: number;
}

export async function checkConnections(relayUrl: string): Promise<ConnectionStatus> {
  const status: ConnectionStatus = { http: 'pending', cors: 'pending', websocket: 'pending' };
  const httpUrl = wsToHttp(relayUrl);

  // HTTP check
  status.http = 'checking';
  try {
    const start = performance.now();
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10_000),
    });
    status.latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      status.http = 'success';
      status.httpDetail = `${res.status} OK · ${status.latencyMs}ms`;
    } else {
      status.http = 'error';
      status.httpDetail = `${res.status} ${res.statusText}`;
    }
  } catch (e: unknown) {
    status.http = 'error';
    status.httpDetail = e instanceof Error ? e.message : 'Failed';
  }

  // CORS check
  status.cors = 'checking';
  if (status.http === 'success') {
    status.cors = 'success';
    status.corsDetail = 'Cross-origin headers present';
  } else if (status.http === 'error') {
    try {
      await fetch(httpUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5_000),
      });
      status.cors = 'error';
      status.corsDetail = 'Blocked — relay may not set CORS headers';
    } catch {
      status.cors = 'error';
      status.corsDetail = 'Unable to determine (HTTP failed)';
    }
  } else {
    status.cors = 'pending';
  }

  // WebSocket check
  status.websocket = 'checking';
  const wsUrl = relayUrl.startsWith('http') ? httpToWs(relayUrl) : relayUrl;
  try {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timed out'));
      }, 5000);
      ws.onopen = () => {
        clearTimeout(timeout);
        status.websocket = 'success';
        status.wsDetail = 'Connected successfully';
        ws.close();
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  } catch (e: unknown) {
    status.websocket = 'error';
    status.wsDetail = e instanceof Error ? e.message : 'Connection failed';
  }

  return status;
}
