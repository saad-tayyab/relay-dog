<script lang="ts">
import type { DirectoryFilters } from '@relayscope/shared';

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
  onSort: (sortBy: DirectoryFilters['sortBy'], sortOrder: DirectoryFilters['sortOrder']) => void;
  onCountryChange: (country: string | null) => void;
  supportsNip50?: boolean;
} = $props();

let searchInput = $state('');
let nipInput = $state('');
let countryInput = $state('');
let sortLocal = $state<DirectoryFilters['sortBy']>('name');
let sortDirection = $state<DirectoryFilters['sortOrder']>('asc');

// Sync local state when parent-provided filters change
$effect(() => {
  searchInput = filters.search || '';
});
$effect(() => {
  nipInput = filters.nips?.join(', ') || '';
});
$effect(() => {
  countryInput = filters.country || '';
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
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  onNipsChange(nips);
}

function handleCountryChange() {
  onCountryChange(countryInput || null);
}
</script>

<div class="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-dark-card border border-dark-border">
  <!-- Search -->
  <div class="relative flex-1 min-w-[200px]">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
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
    <input
      id="dir-search"
      type="text"
      bind:value={searchInput}
      oninput={handleSearchInput}
      placeholder={supportsNip50 ? "Search relays (NIP-50)…" : "Search relays…"}
      class="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
  </div>

  <!-- NIP Filter -->
  <div class="relative">
    <label for="dir-nips" class="sr-only">Filter by NIPs</label>
    <input
      id="dir-nips"
      type="text"
      bind:value={nipInput}
      onblur={handleNipBlur}
      placeholder="NIPs (e.g. 42, 11)"
      class="w-36 px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
    />
  </div>

  <!-- Country Filter -->
  <div class="relative">
    <label for="dir-country" class="sr-only">Filter by country</label>
    <input
      id="dir-country"
      type="text"
      bind:value={countryInput}
      onblur={handleCountryChange}
      placeholder="Country (e.g. US)"
      class="w-28 px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
    />
  </div>

  <!-- Sort -->
  <label for="dir-sort" class="sr-only">Sort by</label>
  <select
    id="dir-sort"
    bind:value={sortLocal}
    onchange={() => onSort(sortLocal, sortDirection)}
    class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-all"
  >
    <option value="name">Name</option>
    <option value="url">URL</option>
    <option value="lastChecked">Last Checked</option>
    <option value="latency">Latency</option>
  </select>

  <button
    type="button"
    onclick={() => onSort(sortLocal, sortDirection === 'asc' ? 'desc' : 'asc')}
    aria-label="Toggle sort order (currently {sortDirection === 'asc' ? 'ascending' : 'descending'})"
    class="p-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
  >
    {sortDirection === 'asc' ? '↑' : '↓'}
  </button>
</div>
