<script lang="ts">
import type { DirectoryRelay } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Checkbox } from "$lib/components/ui/checkbox";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { safeHttpsIconUrl } from "../../utils/relay";
import TooltipWrap from "../shared/TooltipWrap.svelte";

let {
	relay,
	onSelect,
	onInspect,
	selected,
}: {
	relay: DirectoryRelay;
	onSelect: (id: string) => void;
	onInspect: (url: string) => void;
	selected: boolean;
} = $props();

const iconUrl = $derived(safeHttpsIconUrl(relay.icon));

function handleImageError(e: Event) {
	const img = e.target as HTMLImageElement;
	img.style.display = "none";
}

function handleUrlClick(e: MouseEvent) {
	e.stopPropagation();
	// Convert wss:// to https:// for browser-friendly link
	const httpUrl = relay.url
		.replace(/^wss:\/\//i, "https://")
		.replace(/^ws:\/\//i, "http://");
	window.open(httpUrl, "_blank", "noopener,noreferrer");
}

function handleInspect(e: MouseEvent) {
	e.stopPropagation();
	onInspect(relay.url);
}

const isOnline = $derived(
	relay.lastDiscovery != null &&
		Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime() <
			24 * 60 * 60 * 1000,
);

const latencyDisplay = $derived(
	relay.lastDiscovery?.rttOpen != null
		? `${relay.lastDiscovery.rttOpen}ms`
		: "—",
);

const nipCount = $derived(relay.supportedNips.length);

function softwareHref(raw: string): string {
	return raw.replace(/^git\+/, "");
}

function isSoftwareUrl(raw: string): boolean {
	return /^git\+https?:\/\//.test(raw) || /^https?:\/\//.test(raw);
}
</script>

<button
  type="button"
  onclick={() => onSelect(relay.id)}
  class="group w-full text-left transition-all relative cursor-pointer outline-none {selected
    ? 'ring-2 ring-accent border-accent-border'
    : 'hover:border-accent-border/50'}"
>
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
    <div class="flex items-start gap-3">
      {#if iconUrl}
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          decoding="async"
          class="w-10 h-10 rounded-lg border border-dark-border object-cover shrink-0"
          referrerpolicy="no-referrer"
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="text-xs text-text-muted font-mono truncate mb-2 cursor-pointer hover:text-accent hover:underline decoration-dotted underline-offset-2 transition-colors inline-flex items-center gap-1 text-left"
          onclick={handleUrlClick}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); const httpUrl = relay.url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://'); window.open(httpUrl, '_blank', 'noopener,noreferrer'); } }}
          title="Open relay URL"
        >
          {relay.url}
          <svg
            aria-hidden="true"
            class="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </Button>

        {#if relay.description}
          <p class="text-xs text-text-secondary line-clamp-2 mb-2">{relay.description}</p>
        {/if}

        <div class="flex items-center gap-3 text-xs text-text-muted">
          <span>{nipCount} NIPs</span>
          <span>·</span>
          <span>{latencyDisplay}</span>
          {#if relay.software}
            <span>·</span>
            {#if isSoftwareUrl(relay.software)}
              <a
                href={softwareHref(relay.software)}
                target="_blank"
                rel="noopener noreferrer"
                onclick={(e) => e.stopPropagation()}
                class="hover:text-accent hover:underline decoration-dotted underline-offset-2 transition-colors"
              >{relay.software}</a>
            {:else}
              <span>{relay.software}</span>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Actions — always visible on mobile, hover-reveal on desktop -->
      <div class="shrink-0 flex flex-col items-center gap-1">
        <TooltipWrap label="Inspect relay">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onclick={handleInspect}
            aria-label="Inspect relay"
            class="text-muted-foreground transition-all hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg
              aria-hidden="true"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Button>
        </TooltipWrap>

        <!-- biome-ignore lint/a11y/noLabelWithoutControl: label wraps input, valid association -->
        <label class="relative flex items-center justify-center p-1 cursor-pointer">
          <Checkbox
            checked={selected}
            aria-label="Select {relay.name || 'relay'} for comparison"
            class="peer"
            onclick={(e: MouseEvent) => {
              e.stopPropagation();
              onSelect(relay.id);
            }}
          />
        </label>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            type="button"
            aria-label="Relay actions"
            onclick={(e: MouseEvent) => e.stopPropagation()}
            onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
            class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg aria-hidden="true" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onclick={(e: MouseEvent) => { e.stopPropagation(); onInspect(relay.url); }}>
              Inspect
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={(e: MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(relay.url); }}>
              Copy URL
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={(e: MouseEvent) => { e.stopPropagation(); window.open(relay.url, '_blank', 'noopener,noreferrer'); }}>
              Open in new tab
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  </Card.Content></Card.Root>
</button>
