import { SectionCard } from './SectionCard';

const LABELS: Record<string, string> = {
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

const BOOLEAN_KEYS = ['auth_required', 'payment_required', 'restricted_writes'];

export function LimitationsPanel({ limitation }: { limitation?: Record<string, unknown> }) {
  if (!limitation) return null;

  const items = Object.entries(limitation).filter(([, v]) => v !== undefined && v !== null);
  if (items.length === 0) return null;

  return (
    <SectionCard className="animate-fade-in">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Limitations & Policies
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(([key, val]) => {
          const isBool = BOOLEAN_KEYS.includes(key);
          const isTrue = val === true;
          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-dark-surface border border-dark-border"
            >
              <span className="text-sm text-text-secondary">
                {LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
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
