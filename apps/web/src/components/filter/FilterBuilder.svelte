<script lang="ts">
import { SectionCard } from "@relayscope/ui";

let {
	connected,
	onSend,
}: {
	connected: boolean;
	onSend: (message: string) => void;
} = $props();

let kinds = $state("1");
let authors = $state("");
let limit = $state(50);
let since = $state("");
let until = $state("");
let subId = $state<string | null>(null);

function generateSubId(): string {
	return `rs-${Math.random().toString(36).slice(2, 10)}`;
}

function handleSubscribe() {
	const filter: Record<string, unknown> = {};

	// Parse kinds
	const kindList = kinds
		.split(",")
		.map((k) => Number.parseInt(k.trim(), 10))
		.filter((k) => !Number.isNaN(k));
	if (kindList.length > 0) filter.kinds = kindList;

	// Parse authors
	const authorList = authors
		.split(",")
		.map((a) => a.trim())
		.filter((a) => a.length > 0);
	if (authorList.length > 0) filter.authors = authorList;

	// Limit
	if (limit > 0) filter.limit = limit;

	// Time range
	if (since) {
		const sinceTs = Math.floor(new Date(since).getTime() / 1000);
		if (!Number.isNaN(sinceTs)) filter.since = sinceTs;
	}
	if (until) {
		const untilTs = Math.floor(new Date(until).getTime() / 1000);
		if (!Number.isNaN(untilTs)) filter.until = untilTs;
	}

	const id = generateSubId();
	subId = id;

	const req = JSON.stringify(["REQ", id, filter]);
	onSend(req);
}

function handleUnsubscribe() {
	if (!subId) return;
	const close = JSON.stringify(["CLOSE", subId]);
	onSend(close);
	subId = null;
}
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-text-primary">Subscription Filter</h3>
    {#if subId}
      <span
        class="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent"
      >
        {subId}
      </span>
    {/if}
  </div>

  <fieldset class="grid grid-cols-2 gap-3 mb-4 border-0 p-0 m-0">
    <legend class="sr-only">Filter parameters</legend>

    <!-- Kinds -->
    <div>
      <label for="filter-kinds" class="block text-xs text-text-muted mb-1">Kinds</label>
      <input
        id="filter-kinds"
        type="text"
        bind:value={kinds}
        placeholder="0, 1, 4, 42"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Limit -->
    <div>
      <label for="filter-limit" class="block text-xs text-text-muted mb-1">Limit</label>
      <input
        id="filter-limit"
        type="number"
        bind:value={limit}
        min="1"
        max="500"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Since -->
    <div>
      <label for="filter-since" class="block text-xs text-text-muted mb-1">Since</label>
      <input
        id="filter-since"
        type="datetime-local"
        bind:value={since}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all [color-scheme:dark]"
      />
    </div>

    <!-- Until -->
    <div>
      <label for="filter-until" class="block text-xs text-text-muted mb-1">Until</label>
      <input
        id="filter-until"
        type="datetime-local"
        bind:value={until}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all [color-scheme:dark]"
      />
    </div>
  </fieldset>

  <!-- Authors (full width) -->
  <fieldset class="mb-4 border-0 p-0 m-0">
    <legend class="sr-only">Authors filter</legend>
    <label for="filter-authors" class="block text-xs text-text-muted mb-1">
      Authors (hex pubkeys, comma-separated)
    </label>
    <input
      id="filter-authors"
      type="text"
      bind:value={authors}
      placeholder="abc123..., def456..."
      class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
  </fieldset>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    {#if !subId}
      <button
        type="button"
        onclick={handleSubscribe}
        disabled={!connected}
        class="min-h-[44px] px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Subscribe
      </button>
    {:else}
      <button
        type="button"
        onclick={handleUnsubscribe}
        class="min-h-[44px] px-4 py-2 rounded-lg bg-error-dim border border-error/20 text-error text-sm font-medium hover:bg-error/25 transition-all"
      >
        Unsubscribe
      </button>
    {/if}
    {#if !connected}
      <span class="text-xs text-text-muted">Connect to a relay first</span>
    {/if}
  </div>
</SectionCard>
