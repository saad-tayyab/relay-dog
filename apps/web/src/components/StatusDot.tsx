import type { CheckStatus } from '../utils/relay';

const COLORS: Record<CheckStatus, string> = {
  success: 'bg-success',
  error: 'bg-error',
  checking: 'bg-warning',
  pending: 'bg-text-muted',
};

export function StatusDot({ status }: { status: CheckStatus }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2.5 h-2.5 rounded-full ${COLORS[status] || COLORS.pending} ${
        status === 'checking' ? 'animate-pulse-dot' : ''
      }`}
    />
  );
}
