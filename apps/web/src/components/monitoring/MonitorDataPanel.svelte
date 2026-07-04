<script lang="ts">
import type { RelayDiscovery } from "@relayscope/shared";

let {
	discoveries,
	stats,
}: {
	discoveries: RelayDiscovery[];
	stats: {
		monitorCount: number;
		avgRttOpen: number | null;
		avgRttRead: number | null;
		avgRttWrite: number | null;
	};
} = $props();
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h4 class="text-xs font-semibold text-text-primary">Monitor Observations</h4>
    <span class="text-[10px] text-text-muted">
      {stats.monitorCount} monitor{stats.monitorCount !== 1 ? 's' : ''}
    </span>
  </div>

  <!-- Aggregate Stats -->
  <div class="grid grid-cols-3 gap-2">
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Open RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttOpen != null ? `${stats.avgRttOpen}ms` : '—'}
      </p>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Read RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttRead != null ? `${stats.avgRttRead}ms` : '—'}
      </p>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <p class="text-[10px] text-text-muted mb-1">Write RTT</p>
      <p class="text-xs font-mono text-text-primary">
        {stats.avgRttWrite != null ? `${stats.avgRttWrite}ms` : '—'}
      </p>
    </div>
  </div>

  <!-- Individual Observations -->
  {#if discoveries.length > 0}
    <div class="space-y-1 max-h-48 overflow-y-auto">
      {#each discoveries.slice(0, 5) as discovery (discovery.id)}
        <div class="flex items-center justify-between px-2 py-1.5 rounded bg-dark-surface/50 text-[10px]">
          <span class="text-text-muted font-mono truncate max-w-[120px]">
            {discovery.monitorPubkey.slice(0, 8)}…
          </span>
          <div class="flex items-center gap-2 text-text-muted">
            {#if discovery.rttOpen}
              <span>O:{discovery.rttOpen}ms</span>
            {/if}
            {#if discovery.networkType}
              <span class="px-1 py-0.5 rounded bg-dark-border text-text-secondary">
                {discovery.networkType}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-[10px] text-text-muted text-center py-2">No monitor observations yet</p>
  {/if}
</div>
