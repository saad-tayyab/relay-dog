import type { ConnectionStatus } from '../utils/relay';
import { SectionCard } from './SectionCard';
import { StatusDot } from './StatusDot';

export function ConnectionStatusPanel({ status }: { status: ConnectionStatus | null }) {
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
