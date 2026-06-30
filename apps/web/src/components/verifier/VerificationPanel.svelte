<script lang="ts">
import type { NostrEvent } from '@relayscope/shared';
import { eventIdMatches, toNpub, verifySignature } from '../../utils/nostrVerify';
import SectionCard from '../SectionCard.svelte';

let { event }: { event: NostrEvent } = $props();

const sigResult = $derived(verifySignature(event));
const idResult = $derived(eventIdMatches(event));
const npub = $derived(toNpub(event.pubkey));

function truncateHex(hex: string, chars = 8): string {
  if (hex.length <= chars * 2) return hex;
  return `${hex.slice(0, chars)}…${hex.slice(-chars)}`;
}
</script>

<SectionCard className="space-y-4">
  <h3 class="text-sm font-semibold text-text-primary">Verification</h3>

  <!-- Signature check -->
  <div
    class="flex items-start gap-3 p-3 rounded-lg {sigResult
      ? 'bg-success-dim border border-success/20'
      : 'bg-error-dim border border-error/20'}"
  >
    <div class="shrink-0 mt-0.5">
      {#if sigResult}
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else}
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium {sigResult ? 'text-success' : 'text-error'}">
        Signature {sigResult ? 'Valid' : 'Invalid'}
      </p>
      <p class="text-xs text-text-muted mt-0.5">
        Schnorr signature verification (NIP-01)
      </p>
    </div>
  </div>

  <!-- Event ID check -->
  <div
    class="flex items-start gap-3 p-3 rounded-lg {idResult.matches
      ? 'bg-success-dim border border-success/20'
      : 'bg-error-dim border border-error/20'}"
  >
    <div class="shrink-0 mt-0.5">
      {#if idResult.matches}
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else}
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium {idResult.matches ? 'text-success' : 'text-error'}">
        Event ID {idResult.matches ? 'Match' : 'Mismatch'}
      </p>
      <p class="text-xs text-text-muted mt-0.5">
        SHA-256 of canonical serialization
      </p>
      {#if !idResult.matches}
        <div class="mt-2 space-y-1">
          <div class="text-xs">
            <span class="text-text-muted">Stored: </span>
            <code class="font-mono text-error">{truncateHex(event.id)}</code>
          </div>
          <div class="text-xs">
            <span class="text-text-muted">Computed: </span>
            <code class="font-mono text-success">{truncateHex(idResult.computed)}</code>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Signing pubkey -->
  <div class="p-3 rounded-lg bg-dark-surface border border-dark-border">
    <p class="text-xs text-text-muted mb-1">Signing Public Key</p>
    <p class="text-xs font-mono text-text-secondary break-all" title={event.pubkey}>
      {event.pubkey}
    </p>
    <p class="text-xs font-mono text-accent mt-1" title={npub}>
      {npub}
    </p>
  </div>
</SectionCard>
