<script lang="ts">
import type { NostrEvent } from '@relayscope/shared';
import { toNpub } from '../../utils/nostrVerify';
import SectionCard from '../SectionCard.svelte';
import KindBadge from './KindBadge.svelte';

let { event }: { event: NostrEvent } = $props();

let contentExpanded = $state(false);
let copiedId = $state(false);
let copiedPubkey = $state(false);

const npub = $derived(toNpub(event.pubkey));

const relativeTime = $derived(formatRelativeTime(event.created_at));
const absoluteTime = $derived(formatAbsoluteTime(event.created_at));
const contentTooLong = $derived(event.content.length > 500);
const displayedContent = $derived(
  contentTooLong && !contentExpanded ? `${event.content.slice(0, 500)}…` : event.content,
);

function formatRelativeTime(createdAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - createdAt;

  if (diff < 0 || diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
}

function formatAbsoluteTime(createdAt: number): string {
  return new Date(createdAt * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function copyToClipboard(text: string, which: 'id' | 'pubkey'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    if (which === 'id') {
      copiedId = true;
      setTimeout(() => (copiedId = false), 1500);
    } else {
      copiedPubkey = true;
      setTimeout(() => (copiedPubkey = false), 1500);
    }
  } catch {
    // Clipboard API may be denied
  }
}
</script>

<SectionCard className="space-y-4">
  <h3 class="text-sm font-semibold text-text-primary">Event Details</h3>

  <!-- Screen reader live region for copy feedback -->
  <div aria-live="polite" class="sr-only">
    {copiedId ? 'Event ID copied to clipboard' : ''}
    {copiedPubkey ? 'Pubkey copied to clipboard' : ''}
  </div>

  <!-- Kind -->
  <div>
    <p class="text-xs text-text-muted mb-1">Kind</p>
    <KindBadge kind={event.kind} />
  </div>

  <!-- ID -->
  <div>
    <div class="flex items-center gap-2 mb-1">
      <p class="text-xs text-text-muted">ID</p>
      <button
        type="button"
        aria-label="Copy event ID to clipboard"
        onclick={() => copyToClipboard(event.id, 'id')}
        class="min-h-[44px] text-xs px-2 py-1 text-text-muted hover:text-accent transition-colors flex items-center gap-1"
      >
        {#if copiedId}
          <svg
            aria-hidden="true"
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        {:else}
          <svg
            aria-hidden="true"
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        {/if}
      </button>
    </div>
    <p class="text-xs font-mono text-text-secondary break-all" title={event.id}>
      {event.id}
    </p>
  </div>

  <!-- Pubkey -->
  <div>
    <div class="flex items-center gap-2 mb-1">
      <p class="text-xs text-text-muted">Pubkey</p>
      <button
        type="button"
        aria-label="Copy pubkey to clipboard"
        onclick={() => copyToClipboard(event.pubkey, 'pubkey')}
        class="min-h-[44px] text-xs px-2 py-1 text-text-muted hover:text-accent transition-colors flex items-center gap-1"
      >
        {#if copiedPubkey}
          <svg
            aria-hidden="true"
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        {:else}
          <svg
            aria-hidden="true"
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        {/if}
      </button>
    </div>
    <p class="text-xs font-mono text-text-secondary break-all" title={event.pubkey}>
      {event.pubkey}
    </p>
    <p class="text-xs font-mono text-accent mt-0.5" title={npub}>
      {npub}
    </p>
  </div>

  <!-- Created At -->
  <div>
    <p class="text-xs text-text-muted mb-1">Created At</p>
    <p class="text-sm text-text-secondary">
      {relativeTime}
      <span class="text-text-muted ml-1.5">({absoluteTime})</span>
    </p>
  </div>

  <!-- Content -->
  <div>
    <p class="text-xs text-text-muted mb-1">Content</p>
    <div
      class="p-3 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed"
    >
      {displayedContent}
    </div>
    {#if contentTooLong}
      <button
        type="button"
        aria-expanded={contentExpanded}
        onclick={() => (contentExpanded = !contentExpanded)}
        class="min-h-[44px] text-xs px-2 py-1 text-accent hover:text-accent/80 transition-colors mt-1.5"
      >
        {contentExpanded ? 'Show less' : `Show all (${event.content.length} chars)`}
      </button>
    {/if}
  </div>
</SectionCard>
