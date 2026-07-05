<script lang="ts">
import ServerIcon from "@lucide/svelte/icons/server";
import TagIcon from "@lucide/svelte/icons/tag";
import type { RelayPopularity } from "@relayscope/shared";
import * as Card from "$lib/components/ui/card";
import { useRelayDiscovery } from "../../lib/composables/useRelayDiscovery.svelte";
import { apiFetch } from "../../utils/api";
import type { RelayInfo } from "../../utils/relay";
import { safeHttpsIconUrl } from "../../utils/relay";
import MonitorDataPanel from "../monitoring/MonitorDataPanel.svelte";
import FeeDisplay from "../nip11/FeeDisplay.svelte";
import RelayListBadge from "./RelayListBadge.svelte";

let {
	relayId,
	relay: _relay,
	info,
}: {
	relayId?: string;
	relay?: { url: string };
	info: RelayInfo;
} = $props();

const iconUrl = $derived(safeHttpsIconUrl(info.icon));

function softwareHref(raw: string): string {
	return raw.replace(/^git\+/, "");
}

function isSoftwareUrl(raw: string): boolean {
	return /^git\+https?:\/\//.test(raw) || /^https?:\/\//.test(raw);
}
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const discovery = useRelayDiscovery();
let popularity = $state<RelayPopularity | null>(null);

function handleImageError(e: Event) {
	const img = e.target as HTMLImageElement;
	img.style.display = "none";
}

// Fetch discovery and popularity data on mount
$effect(() => {
	if (!relayId) return;

	const controller = new AbortController();
	discovery.fetchDiscoveries(relayId);

	apiFetch(`/api/relays/${relayId}/popularity`, {
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

<div class="flex flex-col gap-5">
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-fade-in"><Card.Content class="p-5 lg:p-6">
    <div class="flex items-start gap-5">
      {#if iconUrl}
        <img
          src={iconUrl}
          alt="Relay icon"
          loading="lazy"
          decoding="async"
          class="size-16 rounded-xl border border-border object-cover shrink-0"
          referrerpolicy="no-referrer"
          onerror={handleImageError}
        />
      {/if}
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold text-foreground mb-1">
          {info.name || 'Unknown Relay'}
        </h2>
        {#if info.description}
          <p class="text-sm text-muted-foreground leading-relaxed mb-3">{info.description}</p>
        {/if}
        <div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {#if info.software}
            <span class="flex items-center gap-1.5">
              <ServerIcon class="size-3.5" aria-hidden="true" />
              {#if isSoftwareUrl(info.software)}
                <a
                  href={softwareHref(info.software)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-primary hover:underline decoration-dotted underline-offset-2 transition-colors"
                >{info.software}</a>
              {:else}
                {info.software}
              {/if}
            </span>
          {/if}
          {#if info.version}
            <span class="flex items-center gap-1.5">
              <TagIcon class="size-3.5" aria-hidden="true" />
              v{info.version}
            </span>
          {/if}
        </div>
      </div>
    </div>
  </Card.Content></Card.Root>

  <!-- Fees -->
  {#if info.fees}
    <FeeDisplay fees={info.fees} />
  {/if}

  <!-- Popularity -->
  {#if popularity && (popularity.readCount > 0 || popularity.writeCount > 0)}
    <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
      <RelayListBadge readCount={popularity.readCount} writeCount={popularity.writeCount} />
    </Card.Content></Card.Root>
  {/if}

  <!-- Monitor Data -->
  {#if discovery.stats}
    <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
      <MonitorDataPanel discoveries={discovery.discoveries} stats={discovery.stats} />
    </Card.Content></Card.Root>
  {/if}
</div>
