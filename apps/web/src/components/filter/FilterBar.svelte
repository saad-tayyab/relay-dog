<script lang="ts">
import type { DirectoryFilters } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import TooltipWrap from "../shared/TooltipWrap.svelte";

let {
	filters,
	onSearch,
	onNipsChange,
	onSort,
	onCountryChange,
	supportsNip50 = false,
}: {
	filters: DirectoryFilters;
	onSearch: (search: string) => void;
	onNipsChange: (nips: number[]) => void;
	onSort: (
		sortBy: DirectoryFilters["sortBy"],
		sortOrder: DirectoryFilters["sortOrder"],
	) => void;
	onCountryChange: (country: string | null) => void;
	supportsNip50?: boolean;
} = $props();

let searchInput = $state("");
let nipInput = $state("");
let countryInput = $state("");
let sortLocal = $state<DirectoryFilters["sortBy"]>("name");
let sortDirection = $state<DirectoryFilters["sortOrder"]>("asc");

// Sync local state when parent-provided filters change
$effect(() => {
	searchInput = filters.search || "";
});
$effect(() => {
	nipInput = filters.nips?.join(", ") || "";
});
$effect(() => {
	countryInput = filters.country || "";
});
$effect(() => {
	sortLocal = filters.sortBy;
});
$effect(() => {
	sortDirection = filters.sortOrder;
});

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function handleSearchInput() {
	if (searchTimeout) clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		onSearch(searchInput);
	}, 300);
}

function handleNipBlur() {
	const nips = nipInput
		.split(",")
		.map((s) => Number(s.trim()))
		.filter((n) => !Number.isNaN(n) && n > 0);
	onNipsChange(nips);
}

function handleCountryChange() {
	onCountryChange(countryInput || null);
}
</script>

<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
  <!-- Search -->
  <div class="relative flex-1 min-w-[200px]">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <label for="dir-search" class="sr-only">Search relays</label>
    <Input
      id="dir-search"
      type="text"
      bind:value={searchInput}
      oninput={handleSearchInput}
      placeholder={supportsNip50 ? "Search relays (NIP-50)…" : "Search relays…"}
      class="h-10 w-full border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
    />
  </div>

  <!-- NIP Filter -->
  <div class="relative">
    <label for="dir-nips" class="sr-only">Filter by NIPs</label>
    <Input
      id="dir-nips"
      type="text"
      bind:value={nipInput}
      onblur={handleNipBlur}
      placeholder="NIPs (e.g. 42, 11)"
      class="h-10 w-36 border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
    />
  </div>

  <!-- Country Filter -->
  <div class="relative">
    <label for="dir-country" class="sr-only">Filter by country</label>
    <Input
      id="dir-country"
      type="text"
      bind:value={countryInput}
      onblur={handleCountryChange}
      placeholder="Country (e.g. US)"
      class="h-10 w-28 border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
    />
  </div>

  <!-- Sort -->
  <label for="dir-sort" class="sr-only">Sort by</label>
  <select
    id="dir-sort"
    bind:value={sortLocal}
    onchange={() => onSort(sortLocal, sortDirection)}
    class="h-10 rounded-lg border border-border bg-background px-3 text-xs text-foreground"
  >
    <option value="name">Name</option>
    <option value="url">URL</option>
    <option value="lastChecked">Last Checked</option>
    <option value="latency">Latency</option>
  </select>

  <TooltipWrap label="Toggle sort order">
    <Button
      type="button"
      variant="outline"
      size="icon"
      onclick={() => onSort(sortLocal, sortDirection === 'asc' ? 'desc' : 'asc')}
      aria-label="Toggle sort order (currently {sortDirection === 'asc' ? 'ascending' : 'descending'})"
      class="min-h-[44px] min-w-[44px] border-border bg-background text-muted-foreground hover:text-foreground"
    >
      {sortDirection === 'asc' ? '↑' : '↓'}
    </Button>
  </TooltipWrap>
</div>
