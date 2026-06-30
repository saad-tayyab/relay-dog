<script lang="ts">
import type { DirectoryRelay } from '@relayscope/shared';
import SectionCard from './SectionCard.svelte';

let {
  relay,
  onSelect,
  selected,
}: {
  relay: DirectoryRelay;
  onSelect: (id: string) => void;
  selected: boolean;
} = $props();

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

const isOnline = $derived(
  relay.lastHealthCheck?.httpReachable && relay.lastHealthCheck?.websocketConnectable,
);

const latencyDisplay = $derived(
  relay.lastHealthCheck?.latencyMs != null ? `${relay.lastHealthCheck.latencyMs}ms` : '—',
);

const nipCount = $derived(relay.supportedNips.length);
</script>

<button
  type="button"
  onclick={() => onSelect(relay.id)}
  class="w-full text-left transition-all {selected
    ? 'ring-2 ring-accent border-accent-border'
    : 'hover:border-accent-border/50'}"
>
  <SectionCard className="cursor-pointer">
    <div class="flex items-start gap-3">
      {#if relay.icon}
        <img
          src={relay.icon}
          alt=""
          class="w-10 h-10 rounded-lg border border-dark-border object-cover shrink-0"
          onerror={handleImageError}
        />
      {:else}
        <div
          class="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center shrink-0"
        >
          <span class="text-text-muted text-sm">⚡</span>
        </div>
      {/if}

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold text-text-primary truncate">
            {relay.name || 'Unknown Relay'}
          </h3>
          {#if isOnline}
            <span class="w-2 h-2 rounded-full bg-success shrink-0"></span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-error shrink-0"></span>
          {/if}
        </div>

        <p class="text-xs text-text-muted font-mono truncate mb-2">{relay.url}</p>

        {#if relay.description}
          <p class="text-xs text-text-secondary line-clamp-2 mb-2">{relay.description}</p>
        {/if}

        <div class="flex items-center gap-3 text-[10px] text-text-muted">
          <span>{nipCount} NIPs</span>
          <span>·</span>
          <span>{latencyDisplay}</span>
          {#if relay.software}
            <span>·</span>
            <span>{relay.software}</span>
          {/if}
        </div>
      </div>

      <div class="shrink-0">
        <input
          type="checkbox"
          checked={selected}
          class="w-4 h-4 rounded border-dark-border text-accent focus:ring-accent-border"
          onclick={(e) => {
            e.stopPropagation();
            onSelect(relay.id);
          }}
        />
      </div>
    </div>
  </SectionCard>
</button>
