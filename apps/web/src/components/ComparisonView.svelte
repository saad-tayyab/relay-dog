<script lang="ts">
import type { DirectoryRelay } from '@relayscope/shared';
import SectionCard from './SectionCard.svelte';

let {
  relayA,
  relayB,
  diff,
  onClose,
}: {
  relayA: DirectoryRelay;
  relayB: DirectoryRelay;
  diff: {
    nipsOnlyInA: number[];
    nipsOnlyInB: number[];
    sharedNips: number[];
    latencyWinner: 'A' | 'B' | 'tie';
    healthWinner: 'A' | 'B' | 'tie';
  };
  onClose: () => void;
} = $props();

function winnerClass(winner: 'A' | 'B' | 'tie', side: 'A' | 'B'): string {
  if (winner === 'tie') return '';
  if (winner === side) return 'text-success';
  return 'text-error';
}

function latencyDisplay(relay: DirectoryRelay): string {
  return relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—';
}

function healthStatus(relay: DirectoryRelay): string {
  if (relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable) {
    return 'Online';
  }
  return 'Offline';
}
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-text-primary">Relay Comparison</h3>
    <button
      type="button"
      onclick={onClose}
      class="text-xs px-3 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
    >
      ✕ Close
    </button>
  </div>

  <!-- Relay Headers -->
  <div class="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayA.name || 'Unknown'}</h4>
      <p class="text-[10px] text-text-muted font-mono truncate">{relayA.url}</p>
    </div>
    <div class="text-text-muted text-xs self-center">vs</div>
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayB.name || 'Unknown'}</h4>
      <p class="text-[10px] text-text-muted font-mono truncate">{relayB.url}</p>
    </div>
  </div>

  <!-- Comparison Rows -->
  <div class="space-y-2">
    <!-- Health -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center {winnerClass(diff.healthWinner, 'A')}">
        {healthStatus(relayA)}
      </span>
      <span class="text-[10px] text-text-muted self-center">Health</span>
      <span class="text-xs text-center {winnerClass(diff.healthWinner, 'B')}">
        {healthStatus(relayB)}
      </span>
    </div>

    <!-- Latency -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'A')}">
        {latencyDisplay(relayA)}
      </span>
      <span class="text-[10px] text-text-muted self-center">Latency</span>
      <span class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'B')}">
        {latencyDisplay(relayB)}
      </span>
    </div>

    <!-- NIP Count -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <span class="text-xs text-center font-mono text-text-primary">
        {relayA.supportedNips.length}
      </span>
      <span class="text-[10px] text-text-muted self-center">NIPs</span>
      <span class="text-xs text-center font-mono text-text-primary">
        {relayB.supportedNips.length}
      </span>
    </div>

    <!-- Shared NIPs -->
    <div class="py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted text-center mb-1">Shared NIPs</p>
      <p class="text-xs text-text-secondary text-center font-mono">
        {diff.sharedNips.length > 0 ? diff.sharedNips.join(', ') : 'None'}
      </p>
    </div>

    <!-- NIPs only in A -->
    {#if diff.nipsOnlyInA.length > 0}
      <div class="py-2 px-3 rounded-lg bg-success-dim border border-success/20">
        <p class="text-[10px] text-success text-center mb-1">Only in {relayA.name || 'A'}</p>
        <p class="text-xs text-success font-mono text-center">
          {diff.nipsOnlyInA.join(', ')}
        </p>
      </div>
    {/if}

    <!-- NIPs only in B -->
    {#if diff.nipsOnlyInB.length > 0}
      <div class="py-2 px-3 rounded-lg bg-success-dim border border-success/20">
        <p class="text-[10px] text-success text-center mb-1">Only in {relayB.name || 'B'}</p>
        <p class="text-xs text-success font-mono text-center">
          {diff.nipsOnlyInB.join(', ')}
        </p>
      </div>
    {/if}
  </div>
</SectionCard>
