import type { EoseState } from '../hooks/useRelaySocket';
import type { CheckStatus } from '../utils/relay';
import { SectionCard } from './SectionCard';
import { StatusDot } from './StatusDot';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const STATUS_MAP: Record<ConnectionStatus, CheckStatus> = {
  disconnected: 'pending',
  connecting: 'checking',
  connected: 'success',
  error: 'error',
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Error',
};

interface ConnectionPanelProps {
  relayUrl: string;
  status: ConnectionStatus;
  eventCount: number;
  eose: EoseState;
  error: string | null;
  notices: string[];
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({
  relayUrl,
  status,
  eventCount,
  eose,
  error,
  notices,
  onConnect,
  onDisconnect,
}: ConnectionPanelProps) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusDot status={STATUS_MAP[status]} />
          <span className="text-sm font-medium text-text-primary">{STATUS_LABEL[status]}</span>
        </div>
        {status === 'disconnected' || status === 'error' ? (
          <button
            type="button"
            onClick={onConnect}
            disabled={!relayUrl}
            className="px-4 py-1.5 rounded-lg bg-success/15 border border-success/30 text-success text-sm font-medium hover:bg-success/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Connect
          </button>
        ) : (
          <button
            type="button"
            onClick={onDisconnect}
            className="px-4 py-1.5 rounded-lg bg-error/15 border border-error/30 text-error text-sm font-medium hover:bg-error/25 transition-all"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Relay URL */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
        <svg
          aria-hidden="true"
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
          />
        </svg>
        <span className="font-mono truncate">{relayUrl || 'No relay URL'}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span>
          Events: <span className="font-mono text-text-primary">{eventCount.toLocaleString()}</span>
        </span>
        {eose.received && (
          <span>
            Historical:{' '}
            <span className="font-mono text-text-primary">
              {eose.historicalCount.toLocaleString()}
            </span>
          </span>
        )}
        {eose.received && (
          <span>
            Live:{' '}
            <span className="font-mono text-text-primary">{eose.liveCount.toLocaleString()}</span>
          </span>
        )}
      </div>

      {/* EOSE banner */}
      {eose.received && eose.historicalCount > 0 && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success">
          ✓ Loaded {eose.historicalCount.toLocaleString()} historical events
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
          ✕ {error}
        </div>
      )}

      {/* Notices */}
      {notices.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {notices.map((notice) => (
            <div
              key={notice}
              className="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs text-warning"
            >
              ⚠ {notice}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
