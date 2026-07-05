<script lang="ts">
import type { RelayDiscovery } from "@relayscope/shared";
import { Badge } from "$lib/components/ui/badge";
import * as Empty from "$lib/components/ui/empty";
import * as ScrollArea from "$lib/components/ui/scroll-area";

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
    <h4 class="text-sm font-semibold text-text-primary">Monitor Observations</h4>
    <span class="text-xs text-text-muted">
      {stats.monitorCount} monitor{stats.monitorCount !== 1 ? 's' : ''}
    </span>
  </div>

  <!-- Aggregate Stats -->
  <dl class="grid grid-cols-3 gap-2">
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs text-text-muted mb-1">Open RTT</dt>
      <dd class="text-xs font-mono text-text-primary">
        {stats.avgRttOpen != null ? `${stats.avgRttOpen}ms` : '—'}
      </dd>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs text-text-muted mb-1">Read RTT</dt>
      <dd class="text-xs font-mono text-text-primary">
        {stats.avgRttRead != null ? `${stats.avgRttRead}ms` : '—'}
      </dd>
    </div>
    <div class="text-center p-2 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs text-text-muted mb-1">Write RTT</dt>
      <dd class="text-xs font-mono text-text-primary">
        {stats.avgRttWrite != null ? `${stats.avgRttWrite}ms` : '—'}
      </dd>
    </div>
  </dl>

  <!-- Individual Observations -->
  {#if discoveries.length > 0}
    <ScrollArea.Root class="max-h-48">
      <div class="space-y-1">
        {#each discoveries.slice(0, 5) as discovery (discovery.id)}
          <div class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-dark-surface/50 text-xs">
            <span class="text-text-muted font-mono truncate max-w-[120px]">
              {discovery.monitorPubkey.slice(0, 8)}…
            </span>
            <div class="flex items-center gap-2 text-text-muted">
              {#if discovery.rttOpen}
                <span>O:{discovery.rttOpen}ms</span>
              {/if}
              {#if discovery.networkType}
                <Badge variant="secondary">{discovery.networkType}</Badge>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </ScrollArea.Root>
  {:else}
    <Empty.Root class="py-4">
      <Empty.Header>
        <Empty.Title class="text-xs">No monitor observations yet</Empty.Title>
      </Empty.Header>
    </Empty.Root>
  {/if}
</div>
