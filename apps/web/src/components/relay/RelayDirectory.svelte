<script lang="ts">
import type { ComparisonDiff, DirectoryRelay } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Spinner } from "$lib/components/ui/spinner";
import { useDirectory } from "../../lib/composables/useDirectory.svelte";
import { apiFetch } from "../../utils/api";
import FilterBar from "../filter/FilterBar.svelte";
import AddRelay from "./AddRelay.svelte";
import ComparisonView from "./ComparisonView.svelte";
import RelayCard from "./RelayCard.svelte";

let { onSelectRelay }: { onSelectRelay: (url: string) => void } = $props();

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const directory = useDirectory();
let selectedIds = $state<Set<string>>(new Set());

// Comparison state
let comparisonRelayA = $state<DirectoryRelay | null>(null);
let comparisonRelayB = $state<DirectoryRelay | null>(null);
let comparisonDiff = $state<ComparisonDiff | null>(null);
let comparisonLoading = $state(false);
let comparisonError = $state<string | null>(null);

// Load initial relays
$effect(() => {
	directory.fetchRelays();
});

function handleSelect(id: string) {
	const newSet = new Set(selectedIds);
	if (newSet.has(id)) {
		newSet.delete(id);
	} else {
		if (newSet.size >= 2) {
			// Replace oldest selection
			const first = newSet.values().next().value;
			if (first) newSet.delete(first);
		}
		newSet.add(id);
	}
	selectedIds = newSet;
}

async function handleCompare() {
	const ids = Array.from(selectedIds);
	if (ids.length !== 2) return;

	comparisonLoading = true;
	comparisonError = null;
	comparisonRelayA = null;
	comparisonRelayB = null;
	comparisonDiff = null;

	try {
		const res = await apiFetch(
			`/api/directory/compare/${ids[0]}/${ids[1]}`,
			{
				signal: AbortSignal.timeout(15_000),
			},
		);
		const json = await res.json();
		if (!json.success) {
			throw new Error(json.error || "Failed to compare relays");
		}
		comparisonRelayA = json.data.relayA;
		comparisonRelayB = json.data.relayB;
		comparisonDiff = json.data.diff;
	} catch (e: unknown) {
		comparisonError =
			e instanceof Error ? e.message : "Failed to compare relays";
	} finally {
		comparisonLoading = false;
	}
}

function closeComparison() {
	comparisonRelayA = null;
	comparisonRelayB = null;
	comparisonDiff = null;
	comparisonError = null;
}
</script>

<div class="space-y-7">
  <!-- Filter Bar -->
  <FilterBar
    filters={directory.filters}
    onSearch={(s) => directory.setSearch(s)}
    onNipsChange={(n) => directory.setNips(n)}
    onSort={(by, order) => directory.setSort(by, order)}
    onCountryChange={(c) => directory.setCountry(c)}
  />

  <!-- Add Relay -->
  <AddRelay onAdded={() => directory.fetchRelays()} />

  <!-- Comparison View -->
  {#if comparisonRelayA && comparisonRelayB && comparisonDiff}
    <ComparisonView
      relayA={comparisonRelayA}
      relayB={comparisonRelayB}
      diff={comparisonDiff}
      onClose={closeComparison}
    />
  {/if}

  {#if comparisonError}
    <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-sm text-error">
      ⚠ {comparisonError}
    </div>
  {/if}

  <!-- Selection Actions -->
  {#if selectedIds.size === 2}
    <div
      class="flex items-center justify-between px-3 py-2 rounded-lg bg-accent-dim border border-accent-border"
    >
      <span class="text-xs text-accent">
        {selectedIds.size} relays selected — ready to compare
      </span>
      <Button
        type="button"
        variant="default"
        onclick={handleCompare}
        disabled={comparisonLoading}
        class="min-h-[44px] px-3 py-2 text-xs"
      >
        {comparisonLoading ? 'Comparing…' : 'Compare →'}
      </Button>
    </div>
  {/if}

  <!-- Loading -->
  {#if directory.loading}
    <div role="status" aria-label="Loading" class="flex items-center justify-center py-16">
      <Spinner class="size-12 text-primary" />
    </div>
  {/if}

  <!-- Error -->
  {#if directory.error}
    <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
      <div class="text-center py-6">
        <p class="text-sm text-error mb-2">Failed to load directory</p>
        <p class="text-xs text-text-muted">{directory.error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => directory.fetchRelays()}
          class="mt-3 text-xs"
        >
          Retry
        </Button>
      </div>
    </Card.Content></Card.Root>
  {/if}

  <!-- Relay List -->
  {#if !directory.loading && !directory.error}
    <div class="space-y-4">
      {#each directory.relays as relay (relay.id)}
        <RelayCard
          {relay}
          onSelect={handleSelect}
          onInspect={onSelectRelay}
          selected={selectedIds.has(relay.id)}
        />
      {/each}
    </div>

    {#if directory.relays.length === 0}
      <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
        <div class="text-center py-8">
          <p class="text-sm text-text-muted">No relays found matching your filters.</p>
        </div>
      </Card.Content></Card.Root>
    {/if}
  {/if}

  <!-- Pagination -->
  {#if directory.totalPages > 1}
    <div class="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={() => directory.setPage(directory.page - 1)}
        disabled={directory.page <= 1}
        class="min-h-[44px] px-3 py-2 text-xs"
      >
        ← Prev
      </Button>
      <span class="text-xs text-text-muted">
        Page {directory.page} of {directory.totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={() => directory.setPage(directory.page + 1)}
        disabled={directory.page >= directory.totalPages}
        class="min-h-[44px] px-3 py-2 text-xs"
      >
        Next →
      </Button>
    </div>
  {/if}

  <!-- Total Count -->
  {#if directory.total > 0}
    <p class="text-center text-xs text-text-muted">
      {directory.total.toLocaleString()} relays in directory
    </p>
  {/if}
</div>
