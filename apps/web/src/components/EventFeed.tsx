import type { NostrEvent } from '@relayscope/shared';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { SectionCard } from './SectionCard';

const KIND_COLORS: Record<number, string> = {
  0: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  1: 'bg-green-500/15 text-green-400 border-green-500/30',
  4: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  42: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

const KIND_LABELS: Record<number, string> = {
  0: 'Metadata',
  1: 'Note',
  4: 'DM',
  42: 'Channel',
};

function getKindColor(kind: number): string {
  return KIND_COLORS[kind] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}

function getKindLabel(kind: number): string {
  return KIND_LABELS[kind] || `Kind ${kind}`;
}

function formatRelativeTime(createdAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - createdAt;

  if (diff < 0 || diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(createdAt * 1000).toLocaleDateString();
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 8)}…`;
}

function truncateContent(content: string, maxLen = 200): string {
  if (content.length <= maxLen) return content;
  return `${content.slice(0, maxLen)}…`;
}

interface EventCardProps {
  event: NostrEvent;
}

const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be denied
    }
  }, [event]);

  const kindColor = getKindColor(event.kind);
  const kindLabel = getKindLabel(event.kind);
  const timestamp = formatRelativeTime(event.created_at);
  const contentPreview = truncateContent(event.content);

  return (
    <div className="border-b border-dark-border last:border-b-0 py-3 px-1">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${kindColor}`}>
          {kindLabel}
        </span>
        <span className="text-[10px] font-mono text-text-muted" title={event.pubkey}>
          {truncatePubkey(event.pubkey)}
        </span>
        <span className="text-[10px] text-text-muted ml-auto shrink-0">{timestamp}</span>
      </div>

      {/* Content preview */}
      {event.content && (
        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {contentPreview}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1"
        >
          <svg
            aria-hidden="true"
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {expanded ? 'Collapse' : 'Raw JSON'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Expanded JSON */}
      {expanded && (
        <pre className="mt-2 p-3 rounded-lg bg-dark-surface border border-dark-border text-[10px] text-text-secondary overflow-x-auto font-mono leading-relaxed max-h-64 overflow-y-auto">
          {JSON.stringify(event, null, 2)}
        </pre>
      )}
    </div>
  );
});

interface EventFeedProps {
  events: NostrEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevLengthRef = useRef(0);

  // Detect if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 50;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    shouldAutoScrollRef.current = isNearBottom;
  }, []);

  // Auto-scroll when new events arrive
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = events.length;

    if (events.length > prevLen && shouldAutoScrollRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [events.length]);

  return (
    <SectionCard className="flex flex-col">
      {/* Event count header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Event Feed</h3>
        <span className="text-xs font-mono text-text-muted">
          {events.length.toLocaleString()} events
        </span>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-xs">
          No events yet. Subscribe with a filter to start receiving events.
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[480px] overflow-y-auto overflow-x-hidden"
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
