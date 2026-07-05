<script lang="ts">
import SearchIcon from "@lucide/svelte/icons/search";
import ZapIcon from "@lucide/svelte/icons/zap";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import { Spinner } from "$lib/components/ui/spinner";

let {
	url = $bindable(""),
	loading,
	onSubmit,
	onQuickPick,
}: {
	url: string;
	loading: boolean;
	onSubmit: (e: Event) => void;
	onQuickPick: (relay: string) => void;
} = $props();

const POPULAR_RELAYS = [
	"relay.damus.io",
	"nos.lol",
	"relay.nostr.band",
	"relay.primal.net",
	"relay.nostr.info",
	"nostr.wine",
	"relay.snort.social",
];
</script>

<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
  Skip to main content
</a>
<search onsubmit={onSubmit} class="mb-8 animate-fade-in" aria-label="Inspect a relay">
  <div class="flex gap-2">
    <div class="relative flex-1">
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <SearchIcon class="size-4" aria-hidden="true" />
      </div>
      <label for="relay-url" class="sr-only">Relay URL</label>
      <Input
        id="relay-url"
        type="text"
        bind:value={url}
        placeholder="wss://relay.damus.io"
        class="h-12 w-full border-border bg-card pl-10 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
    <Button
      type="submit"
      variant="default"
      disabled={loading || !url.trim()}
      class="h-12 px-6 text-sm font-semibold"
    >
      {#if loading}
        <div role="status" class="flex items-center gap-2">
          <Spinner class="size-4" />
          Inspecting
        </div>
      {:else}
        <ZapIcon class="size-4" aria-hidden="true" />
        Inspect
      {/if}
    </Button>
  </div>

  <!-- Quick pick relays -->
  <div class="mt-4 flex flex-wrap gap-2">
    <span class="text-xs text-muted-foreground mr-1 py-1">Try:</span>
    {#each POPULAR_RELAYS as relay (relay)}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={() => onQuickPick(relay)}
        class="min-h-[44px] border-border bg-card text-xs text-muted-foreground hover:text-primary"
      >
        {relay}
      </Button>
    {/each}
  </div>
</search>
