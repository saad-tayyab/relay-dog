import { useState } from 'react';
import { SectionCard } from './SectionCard';

interface FilterBuilderProps {
  connected: boolean;
  onSend: (message: string) => void;
}

function generateSubId(): string {
  return `rs-${Math.random().toString(36).slice(2, 10)}`;
}

export function FilterBuilder({ connected, onSend }: FilterBuilderProps) {
  const [kinds, setKinds] = useState('1');
  const [authors, setAuthors] = useState('');
  const [limit, setLimit] = useState(50);
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [subId, setSubId] = useState<string | null>(null);

  const handleSubscribe = () => {
    const filter: Record<string, unknown> = {};

    // Parse kinds
    const kindList = kinds
      .split(',')
      .map((k) => Number.parseInt(k.trim(), 10))
      .filter((k) => !Number.isNaN(k));
    if (kindList.length > 0) filter.kinds = kindList;

    // Parse authors
    const authorList = authors
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    if (authorList.length > 0) filter.authors = authorList;

    // Limit
    if (limit > 0) filter.limit = limit;

    // Time range
    if (since) {
      const sinceTs = Math.floor(new Date(since).getTime() / 1000);
      if (!Number.isNaN(sinceTs)) filter.since = sinceTs;
    }
    if (until) {
      const untilTs = Math.floor(new Date(until).getTime() / 1000);
      if (!Number.isNaN(untilTs)) filter.until = untilTs;
    }

    const id = generateSubId();
    setSubId(id);

    const req = JSON.stringify(['REQ', id, filter]);
    onSend(req);
  };

  const handleUnsubscribe = () => {
    if (!subId) return;
    const close = JSON.stringify(['CLOSE', subId]);
    onSend(close);
    setSubId(null);
  };

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Subscription Filter</h3>
        {subId && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">
            {subId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Kinds */}
        <div>
          <label htmlFor="filter-kinds" className="block text-xs text-text-muted mb-1">
            Kinds
          </label>
          <input
            id="filter-kinds"
            type="text"
            value={kinds}
            onChange={(e) => setKinds(e.target.value)}
            placeholder="0, 1, 4, 42"
            className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all"
          />
        </div>

        {/* Limit */}
        <div>
          <label htmlFor="filter-limit" className="block text-xs text-text-muted mb-1">
            Limit
          </label>
          <input
            id="filter-limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number.parseInt(e.target.value, 10) || 50)}
            min={1}
            max={500}
            className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all"
          />
        </div>

        {/* Since */}
        <div>
          <label htmlFor="filter-since" className="block text-xs text-text-muted mb-1">
            Since
          </label>
          <input
            id="filter-since"
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all [color-scheme:dark]"
          />
        </div>

        {/* Until */}
        <div>
          <label htmlFor="filter-until" className="block text-xs text-text-muted mb-1">
            Until
          </label>
          <input
            id="filter-until"
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Authors (full width) */}
      <div className="mb-4">
        <label htmlFor="filter-authors" className="block text-xs text-text-muted mb-1">
          Authors (hex pubkeys, comma-separated)
        </label>
        <input
          id="filter-authors"
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="abc123..., def456..."
          className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!subId ? (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={!connected}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Subscribe
          </button>
        ) : (
          <button
            type="button"
            onClick={handleUnsubscribe}
            className="px-4 py-2 rounded-lg bg-error/15 border border-error/30 text-error text-sm font-medium hover:bg-error/25 transition-all"
          >
            Unsubscribe
          </button>
        )}
        {!connected && <span className="text-xs text-text-muted">Connect to a relay first</span>}
      </div>
    </SectionCard>
  );
}
