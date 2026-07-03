<script lang="ts">
import type { RelayPopularity } from '@relayscope/shared';
import { useRelayDiscovery } from '../lib/composables/useRelayDiscovery.svelte';
import type { RelayInfo } from '../utils/relay';
import { safeHttpsIconUrl } from '../utils/relay';
import FeeDisplay from './FeeDisplay.svelte';
import MonitorDataPanel from './MonitorDataPanel.svelte';
import RelayListBadge from './RelayListBadge.svelte';
import SectionCard from './SectionCard.svelte';

let {
  relayId,
  relay,
  info,
}: {
  relayId?: string;
  relay?: { url: string };
  info: RelayInfo;
} = $props();

const iconUrl = $derived(safeHttpsIconUrl(info.icon));

function softwareHref(raw: string): string {
  return raw.replace(/^git\+/, '');
}

function isSoftwareUrl(raw: string): boolean {
  return /^git\+https?:\/\//.test(raw) || /^https?:\/\//.test(raw);
}
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const discovery = useRelayDiscovery();
let popularity = $state<RelayPopularity | null>(null);

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

// Fetch discovery and popularity data on mount
$effect(() => {
  if (!relayId) return;

  const controller = new AbortController();
  discovery.fetchDiscoveries(relayId);

  fetch(`/api/relays/${relayId}/popularity`, {
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.success) popularity = json.data;
    })
    .catch(() => {});

  return () => {
    controller.abort();
  };
});
</script>

<SectionCard className="animate-fade-in">
  <div class="flex items-start gap-5">
    {#if iconUrl}
      <img
        src={iconUrl}
        alt="Relay icon"
        class="w-16 h-16 rounded-xl border border-dark-border object-cover shrink-0"
        referrerpolicy="no-referrer"
        onerror={handleImageError}
      />
    {/if}
    <div class="flex-1 min-w-0">
      <h2 class="text-2xl font-bold text-text-primary mb-1">
        {info.name || 'Unknown Relay'}
      </h2>
      {#if info.description}
        <p class="text-text-secondary leading-relaxed mb-3">{info.description}</p>
      {/if}
      <div class="flex flex-wrap gap-3 text-sm text-text-muted">
        {#if info.software}
          <span class="flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {#if isSoftwareUrl(info.software)}
              <a
                href={softwareHref(info.software)}
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-accent hover:underline decoration-dotted underline-offset-2 transition-colors"
              >{info.software}</a>
            {:else}
              {info.software}
            {/if}
          </span>
        {/if}
        {#if info.version}
          <span class="flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            v{info.version}
          </span>
        {/if}
      </div>
    </div>
  </div>
</SectionCard>

<!-- Fees -->
{#if info.fees}
  <FeeDisplay fees={info.fees} />
{/if}

<!-- Popularity -->
{#if popularity && (popularity.readCount > 0 || popularity.writeCount > 0)}
  <SectionCard>
    <RelayListBadge readCount={popularity.readCount} writeCount={popularity.writeCount} />
  </SectionCard>
{/if}

<!-- Monitor Data -->
{#if discovery.stats}
  <SectionCard>
    <MonitorDataPanel discoveries={discovery.discoveries} stats={discovery.stats} />
  </SectionCard>
{/if}
