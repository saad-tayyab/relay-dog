<script lang="ts">
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

<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
  Skip to main content
</a>
<search onsubmit={onSubmit} class="mb-8 animate-fade-in" aria-label="Inspect a relay">
  <div class="flex gap-2">
    <div class="relative flex-1">
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <svg
          aria-hidden="true"
          class="w-4 h-4"
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
      </div>
      <label for="relay-url" class="sr-only">Relay URL</label>
      <input
        id="relay-url"
        type="text"
        bind:value={url}
        placeholder="wss://relay.damus.io"
        class="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-card border border-dark-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all font-mono text-sm"
      />
    </div>
    <button
      type="submit"
      disabled={loading || !url.trim()}
      class="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
    >
      {#if loading}
        <div
          class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
        ></div>
        Inspecting
      {:else}
        <svg
          aria-hidden="true"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Inspect
      {/if}
    </button>
  </div>

  <!-- Quick pick relays -->
  <div class="mt-3 flex flex-wrap gap-1.5">
    <span class="text-xs text-text-muted mr-1 py-1">Try:</span>
    {#each POPULAR_RELAYS as relay (relay)}
      <button
        type="button"
        onclick={() => onQuickPick(relay)}
        class="text-xs min-h-[44px] px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
      >
        {relay}
      </button>
    {/each}
  </div>
</search>
