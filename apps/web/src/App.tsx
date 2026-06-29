import { useCallback, useState } from 'react';
import {
  ConnectionStatusPanel,
  ErrorMessage,
  LimitationsPanel,
  LoadingSpinner,
  NipBadgeGrid,
  RelayProfile,
} from './components';
import type { ConnectionStatus, RelayInfo } from './utils/relay';
import { checkConnections, fetchNip11, normalizeUrl } from './utils/relay';
import './index.css';

const POPULAR_RELAYS = [
  'relay.damus.io',
  'nos.lol',
  'relay.nostr.band',
  'relay.primal.net',
  'relay.nostr.info',
  'nostr.wine',
  'relay.snort.social',
];

function App() {
  const [url, setUrl] = useState('');
  const [relayInfo, setRelayInfo] = useState<RelayInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(
    async (targetUrl?: string) => {
      const inputUrl = targetUrl || url;
      const normalized = normalizeUrl(inputUrl);
      if (!normalized) return;

      setLoading(true);
      setError(null);
      setRelayInfo(null);
      setConnectionStatus(null);

      try {
        const [info, connStatus] = await Promise.all([
          fetchNip11(normalized),
          checkConnections(normalized),
        ]);
        setRelayInfo(info);
        setConnectionStatus(connStatus);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error occurred');
        try {
          const connStatus = await checkConnections(normalized);
          setConnectionStatus(connStatus);
        } catch {
          // Connection check also failed
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
            {POPULAR_RELAYS.map((r) => (
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
