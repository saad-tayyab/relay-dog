import { useCallback, useState } from 'react';
import './index.css';

// NIP info database for display names and descriptions
const NIP_INFO: Record<number, { name: string; desc: string; color: string }> = {
  0: { name: 'NIP-01', desc: 'Basic protocol flow', color: '#60a5fa' },
  1: { name: 'NIP-02', desc: 'Contact List', color: '#60a5fa' },
  2: { name: 'NIP-03', desc: 'OpenTimestamps', color: '#60a5fa' },
  4: { name: 'NIP-04', desc: 'Encrypted Direct Messages', color: '#f472b6' },
  5: { name: 'NIP-05', desc: 'DNS-Based Identity', color: '#34d399' },
  9: { name: 'NIP-09', desc: 'Event Deletion', color: '#f87171' },
  11: { name: 'NIP-11', desc: 'Relay Information', color: '#c084fc' },
  12: { name: 'NIP-12', desc: 'Generic Tag Queries', color: '#60a5fa' },
  14: { name: 'NIP-14', desc: 'Subject Tag', color: '#60a5fa' },
  15: { name: 'NIP-15', desc: 'End of Stored Events', color: '#60a5fa' },
  16: { name: 'NIP-16', desc: 'Event Treatment', color: '#60a5fa' },
  17: { name: 'NIP-17', desc: 'Private DMs', color: '#f472b6' },
  18: { name: 'NIP-18', desc: 'Reposts', color: '#60a5fa' },
  19: { name: 'NIP-19', desc: 'Bech32 Encoded Entities', color: '#fbbf24' },
  20: { name: 'NIP-20', desc: 'Command Results', color: '#60a5fa' },
  21: { name: 'NIP-21', desc: 'nostr: URI Scheme', color: '#fbbf24' },
  22: { name: 'NIP-22', desc: 'Event Created At', color: '#60a5fa' },
  23: { name: 'NIP-23', desc: 'Long-form Content', color: '#34d399' },
  24: { name: 'NIP-24', desc: 'Extra Event Tags', color: '#60a5fa' },
  25: { name: 'NIP-25', desc: 'Reactions', color: '#fb923c' },
  28: { name: 'NIP-28', desc: 'Public Chat', color: '#60a5fa' },
  33: { name: 'NIP-33', desc: 'Parameterized Replaceable', color: '#60a5fa' },
  40: { name: 'NIP-40', desc: 'Expiration Timestamp', color: '#60a5fa' },
  42: { name: 'NIP-42', desc: 'Relay Authentication', color: '#f87171' },
  44: { name: 'NIP-44', desc: 'Versioned Encryption', color: '#f472b6' },
  45: { name: 'NIP-45', desc: 'Counting Events', color: '#60a5fa' },
  50: { name: 'NIP-50', desc: 'Keywords Filter', color: '#34d399' },
  51: { name: 'NIP-51', desc: 'Lists', color: '#fb923c' },
  52: { name: 'NIP-52', desc: 'Calendar Events', color: '#fb923c' },
  53: { name: 'NIP-53', desc: 'Live Activities', color: '#fb923c' },
  56: { name: 'NIP-56', desc: 'Reporting', color: '#f87171' },
  57: { name: 'NIP-57', desc: 'Zaps', color: '#fbbf24' },
  58: { name: 'NIP-58', desc: 'Badges', color: '#fb923c' },
  59: { name: 'NIP-59', desc: 'Gift Wrapping', color: '#f472b6' },
  60: { name: 'NIP-60', desc: 'Cashu Wallets', color: '#fbbf24' },
  61: { name: 'NIP-61', desc: 'Nutzap', color: '#fbbf24' },
  62: { name: 'NIP-62', desc: 'Request to Wallet', color: '#fbbf24' },
  65: { name: 'NIP-65', desc: 'Relay List Metadata', color: '#34d399' },
  66: { name: 'NIP-66', desc: 'Relay Discovery', color: '#34d399' },
  78: { name: 'NIP-78', desc: 'Application-specific Data', color: '#60a5fa' },
};

interface RelayInfo {
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

interface ConnectionStatus {
  http: 'pending' | 'success' | 'error' | 'checking';
  cors: 'pending' | 'success' | 'error' | 'checking';
  websocket: 'pending' | 'success' | 'error' | 'checking';
  httpDetail?: string;
  corsDetail?: string;
  wsDetail?: string;
  latencyMs?: number;
}

const NIP_LINK = (n: number) =>
  `https://github.com/nostr-protocol/nips/blob/master/${String(n).padStart(2, '0')}.md`;

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return '';
  // Add protocol if missing
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

function wsToHttp(url: string): string {
  return url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
}

function httpToWs(url: string): string {
  return url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
}

// Check connection statuses
async function checkConnections(relayUrl: string): Promise<ConnectionStatus> {
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

  // CORS check — if we got here without a CORS error, it's fine
  status.cors = 'checking';
  if (status.http === 'success') {
    status.cors = 'success';
    status.corsDetail = 'Cross-origin headers present';
  } else if (status.http === 'error') {
    // Try a no-cors mode to at least check reachability
    try {
      await fetch(httpUrl, { method: 'HEAD', mode: 'no-cors' });
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

// Fetch NIP-11 document
async function fetchNip11(url: string): Promise<RelayInfo> {
  const httpUrl = wsToHttp(url);
  const res = await fetch(httpUrl, {
    headers: { Accept: 'application/nostr+json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── UI Components ───

function StatusDot({ status }: { status: string }) {
  const colors = {
    success: 'bg-success',
    error: 'bg-error',
    checking: 'bg-warning',
    pending: 'bg-text-muted',
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status as keyof typeof colors] || 'bg-text-muted'} ${
        status === 'checking' ? 'animate-pulse-dot' : ''
      }`}
    />
  );
}

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function RelayProfile({ info }: { info: RelayInfo }) {
  return (
    <SectionCard className="animate-fade-in">
      <div className="flex items-start gap-5">
        {info.icon && (
          <img
            src={info.icon}
            alt="Relay icon"
            className="w-16 h-16 rounded-xl border border-dark-border object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            {info.name || 'Unknown Relay'}
          </h2>
          {info.description && (
            <p className="text-text-secondary leading-relaxed mb-3">{info.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-text-muted">
            {info.software && (
              <span className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {info.software}
              </span>
            )}
            {info.version && (
              <span className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                v{info.version}
              </span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function NipBadgeGrid({ nips }: { nips: number[] }) {
  if (!nips || nips.length === 0) return null;
  return (
    <SectionCard className="animate-fade-in">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Supported NIPs ({nips.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {nips
          .sort((a, b) => a - b)
          .map((n) => {
            const info = NIP_INFO[n];
            return (
              <a
                key={n}
                href={NIP_LINK(n)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${info?.color || '#60a5fa'}15`,
                  color: info?.color || '#60a5fa',
                  border: `1px solid ${info?.color || '#60a5fa'}30`,
                }}
                title={info?.desc || `NIP-${n}`}
              >
                <span className="font-bold">NIP-{n}</span>
                {info?.desc && <span className="hidden sm:inline opacity-70">· {info.desc}</span>}
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          })}
      </div>
    </SectionCard>
  );
}

function LimitationsPanel({ limitation }: { limitation?: Record<string, unknown> }) {
  if (!limitation) return null;

  const items = Object.entries(limitation).filter(([, v]) => v !== undefined && v !== null);

  if (items.length === 0) return null;

  const labelMap: Record<string, string> = {
    max_message_length: 'Max Message Size',
    max_subscriptions: 'Max Subscriptions',
    max_filters: 'Max Filters',
    max_limit: 'Max Query Limit',
    max_subid_length: 'Max Subscription ID Length',
    max_event_tags: 'Max Event Tags',
    max_content_length: 'Max Content Length',
    min_pow_difficulty: 'Min PoW Difficulty',
    auth_required: 'Auth Required',
    payment_required: 'Payment Required',
    restricted_writes: 'Restricted Writes',
    created_at_lower_limit: 'Created At Lower Limit',
    created_at_upper_limit: 'Created At Upper Limit',
  };

  const booleanKeys = ['auth_required', 'payment_required', 'restricted_writes'];

  return (
    <SectionCard className="animate-fade-in">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Limitations & Policies
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(([key, val]) => {
          const isBool = booleanKeys.includes(key);
          const isTrue = val === true;
          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-dark-surface border border-dark-border"
            >
              <span className="text-sm text-text-secondary">
                {labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              {isBool ? (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isTrue ? 'bg-error-dim text-error' : 'bg-success-dim text-success'
                  }`}
                >
                  {isTrue ? 'Yes' : 'No'}
                </span>
              ) : (
                <span className="text-sm font-mono font-medium text-text-primary">
                  {typeof val === 'number' ? val.toLocaleString() : String(val)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ConnectionStatusPanel({ status }: { status: ConnectionStatus | null }) {
  if (!status) return null;

  const checks = [
    { label: 'HTTP Reachable', key: 'http' as const, detail: status.httpDetail },
    { label: 'CORS Configured', key: 'cors' as const, detail: status.corsDetail },
    { label: 'WebSocket Connectable', key: 'websocket' as const, detail: status.wsDetail },
  ];

  return (
    <SectionCard className="animate-fade-in">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Connection Status
        {status.latencyMs !== undefined && (
          <span className="ml-2 text-xs font-normal normal-case tracking-normal text-text-secondary">
            · {status.latencyMs}ms latency
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {checks.map(({ label, key, detail }) => (
          <div
            key={key}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-dark-surface border border-dark-border"
          >
            <StatusDot status={status[key]} />
            <span className="text-sm text-text-secondary flex-1">{label}</span>
            {status[key] === 'checking' && <span className="text-xs text-warning">Checking…</span>}
            {detail && status[key] !== 'checking' && (
              <span
                className={`text-xs font-medium ${
                  status[key] === 'success' ? 'text-success' : 'text-error'
                }`}
              >
                {detail}
              </span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-dark-border" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-accent animate-spin" />
      </div>
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-error-dim flex items-center justify-center mb-4">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-error font-medium mb-1">Failed to fetch relay info</p>
      <p className="text-text-muted text-sm max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-secondary hover:text-text-primary hover:border-accent-border transition-all text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Main App ───

function App() {
  const [url, setUrl] = useState('');
  const [relayInfo, setRelayInfo] = useState<RelayInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // fetchedUrl can be used in future phases for sharing / deep-linking

  const handleFetch = useCallback(
    async (targetUrl?: string) => {
      const inputUrl = targetUrl || url;
      const normalized = normalizeUrl(inputUrl);
      if (!normalized) return;

      setLoading(true);
      setError(null);
      setRelayInfo(null);
      setConnectionStatus(null);
      // setFetchedUrl(normalized) — for future deep-linking

      try {
        // Fetch NIP-11 and connection checks in parallel
        const [info, connStatus] = await Promise.all([
          fetchNip11(normalized),
          checkConnections(normalized),
        ]);
        setRelayInfo(info);
        setConnectionStatus(connStatus);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error occurred');
        // Still run connection checks even if NIP-11 failed
        try {
          const connStatus = await checkConnections(normalized);
          setConnectionStatus(connStatus);
        } catch {
          // Ignore
        }
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetch();
  };

  const popularRelays = [
    'relay.damus.io',
    'nos.lol',
    'relay.nostr.band',
    'relay.primal.net',
    'relay.nostr.info',
    'nostr.wine',
    'relay.snort.social',
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary leading-tight">Relay Dog</h1>
            <p className="text-xs text-text-muted">Nostr relay inspector</p>
          </div>
          <span className="ml-auto text-[10px] font-mono px-2 py-1 rounded-full bg-dark-surface border border-dark-border text-text-muted">
            MVP · Phase 1
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* URL Input */}
        <form onSubmit={handleSubmit} className="mb-8 animate-fade-in">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="wss://relay.damus.io"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-card border border-dark-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Inspecting
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Inspect
                </>
              )}
            </button>
          </div>

          {/* Quick pick relays */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-text-muted mr-1 py-1">Try:</span>
            {popularRelays.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setUrl(r);
                  handleFetch(r);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
              >
                {r}
              </button>
            ))}
          </div>
        </form>

        {/* Results */}
        {loading && <LoadingSpinner />}

        {!loading && error && !relayInfo && (
          <ErrorMessage message={error} onRetry={() => handleFetch()} />
        )}

        {!loading && relayInfo && (
          <div className="space-y-5">
            <RelayProfile info={relayInfo} />
            <NipBadgeGrid nips={relayInfo.supported_nips || []} />
            <LimitationsPanel limitation={relayInfo.limitation} />
            <ConnectionStatusPanel status={connectionStatus} />

            {/* Raw JSON toggle */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 py-2">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 transition-transform group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Raw NIP-11 JSON
              </summary>
              <pre className="mt-2 p-4 rounded-xl bg-dark-surface border border-dark-border text-xs text-text-secondary overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(relayInfo, null, 2)}
              </pre>
            </details>

            {/* Error details if connection had issues */}
            {!loading && error && relayInfo && (
              <div className="px-4 py-3 rounded-xl bg-warning-dim border border-warning/20 text-sm text-warning">
                ⚠ {error}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !relayInfo && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-6">
              <svg
                aria-hidden="true"
                className="w-10 h-10 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Inspect a Nostr Relay</h2>
            <p className="text-text-muted text-sm max-w-sm mb-6">
              Enter a relay URL above to fetch its NIP-11 info document, check connection status,
              and explore supported features.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
              <span className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
                NIP-11 Info
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
                Connection Checks
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
                NIP Badge Grid
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-text-muted">
          <span>Relay Dog · Nostr Relay Inspector</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
