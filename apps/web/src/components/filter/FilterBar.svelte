<script lang="ts">
import CheckIcon from "@lucide/svelte/icons/check";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import SearchIcon from "@lucide/svelte/icons/search";
import type { DirectoryFilters } from "@relayscope/shared";
import { tick } from "svelte";
import { Button } from "$lib/components/ui/button";
import * as Command from "$lib/components/ui/command";
import { Input } from "$lib/components/ui/input";
import * as Popover from "$lib/components/ui/popover";
import * as Select from "$lib/components/ui/select";
import { cn } from "$lib/shadcn/utils";
import { NIP_OPTIONS } from "../../utils/nip-constants";
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

// ─── NIP Combobox State ───
let nipComboboxOpen = $state(false);
let nipComboboxRef = $state<HTMLButtonElement | null>(null);
let nipSearchValue = $state("");

const selectedNipLabels = $derived.by(() => {
	if (!filters.nips || filters.nips.length === 0) return [];
	return filters.nips
		.map((n) => NIP_OPTIONS.find((o) => o.value === n))
		.filter(Boolean)
		.map((o) => o?.label);
});

function handleNipSelect(nipValue: string) {
	const nip = Number(nipValue);
	if (Number.isNaN(nip)) return;
	const current = filters.nips || [];
	const next = current.includes(nip)
		? current.filter((n) => n !== nip)
		: [...current, nip];
	onNipsChange(next);
	nipSearchValue = "";
}

function closeNipCombobox() {
	nipComboboxOpen = false;
	nipSearchValue = "";
	tick().then(() => {
		nipComboboxRef?.focus();
	});
}

// ─── Country Combobox State ───
let countryComboboxOpen = $state(false);
let countryComboboxRef = $state<HTMLButtonElement | null>(null);
let countrySearchValue = $state("");

const COUNTRY_OPTIONS = [
	{ value: "US", label: "United States" },
	{ value: "DE", label: "Germany" },
	{ value: "GB", label: "United Kingdom" },
	{ value: "FR", label: "France" },
	{ value: "JP", label: "Japan" },
	{ value: "CA", label: "Canada" },
	{ value: "AU", label: "Australia" },
	{ value: "NL", label: "Netherlands" },
	{ value: "SE", label: "Sweden" },
	{ value: "FI", label: "Finland" },
	{ value: "NO", label: "Norway" },
	{ value: "DK", label: "Denmark" },
	{ value: "CH", label: "Switzerland" },
	{ value: "AT", label: "Austria" },
	{ value: "ES", label: "Spain" },
	{ value: "IT", label: "Italy" },
	{ value: "PT", label: "Portugal" },
	{ value: "PL", label: "Poland" },
	{ value: "CZ", label: "Czech Republic" },
	{ value: "RO", label: "Romania" },
	{ value: "BR", label: "Brazil" },
	{ value: "AR", label: "Argentina" },
	{ value: "MX", label: "Mexico" },
	{ value: "NG", label: "Nigeria" },
	{ value: "ZA", label: "South Africa" },
	{ value: "IN", label: "India" },
	{ value: "KR", label: "South Korea" },
	{ value: "SG", label: "Singapore" },
];

function handleCountrySelect(countryValue: string) {
	onCountryChange(countryValue || null);
	countrySearchValue = "";
	countryComboboxOpen = false;
	tick().then(() => {
		countryComboboxRef?.focus();
	});
}
</script>

<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
  <!-- Search -->
  <div class="relative flex-1 min-w-[200px]">
    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <SearchIcon class="size-3.5" aria-hidden="true" />
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

  <!-- NIP Combobox -->
  <Popover.Root bind:open={nipComboboxOpen}>
    <Popover.Trigger bind:ref={nipComboboxRef}>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          role="combobox"
          aria-expanded={nipComboboxOpen}
          aria-label="Filter by NIPs"
          class="h-10 min-w-[140px] max-w-[200px] justify-between rounded-lg border border-border bg-background px-3 text-xs text-foreground hover:bg-accent/5 truncate {props.class ?? ''}"
        >
          {#if selectedNipLabels.length > 0}
            <span class="truncate">{selectedNipLabels.length} NIP{selectedNipLabels.length !== 1 ? 's' : ''} selected</span>
          {:else}
            <span class="text-muted-foreground">NIPs…</span>
          {/if}
          <ChevronDownIcon class="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-[300px] p-0" align="start">
      <Command.Root shouldFilter={true}>
        <Command.Input placeholder="Search NIPs…" bind:value={nipSearchValue} class="h-9" />
        <Command.List>
          <Command.Empty>No NIP found.</Command.Empty>
          <Command.Group>
            {#each NIP_OPTIONS as nip (nip.value)}
              {@const isSelected = filters.nips?.includes(nip.value) ?? false}
              <Command.Item
                value={String(nip.value)}
                onSelect={() => handleNipSelect(String(nip.value))}
              >
                <CheckIcon class="size-4 mr-2 {isSelected ? 'opacity-100' : 'opacity-0'}" aria-hidden="true" />
                <span class="truncate">{nip.label}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
      {#if filters.nips && filters.nips.length > 0}
        <div class="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            class="w-full text-xs text-muted-foreground"
            onclick={() => { onNipsChange([]); closeNipCombobox(); }}
          >
            Clear all
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>

  <!-- Country Combobox -->
  <Popover.Root bind:open={countryComboboxOpen}>
    <Popover.Trigger bind:ref={countryComboboxRef}>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          role="combobox"
          aria-expanded={countryComboboxOpen}
          aria-label="Filter by country"
          class="h-10 min-w-[120px] max-w-[180px] justify-between rounded-lg border border-border bg-background px-3 text-xs text-foreground hover:bg-accent/5 truncate {props.class ?? ''}"
        >
          {#if filters.country}
            <span class="truncate">{COUNTRY_OPTIONS.find(c => c.value === filters.country)?.label ?? filters.country}</span>
          {:else}
            <span class="text-muted-foreground">Country…</span>
          {/if}
          <ChevronDownIcon class="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-[250px] p-0" align="start">
      <Command.Root shouldFilter={true}>
        <Command.Input placeholder="Search countries…" bind:value={countrySearchValue} class="h-9" />
        <Command.List>
          <Command.Empty>No country found.</Command.Empty>
          <Command.Group>
            {#each COUNTRY_OPTIONS as country (country.value)}
              {@const isSelected = filters.country === country.value}
              <Command.Item
                value={`${country.value} ${country.label}`}
                onSelect={() => handleCountrySelect(country.value)}
              >
                <CheckIcon class="size-4 mr-2 {isSelected ? 'opacity-100' : 'opacity-0'}" aria-hidden="true" />
                <span class="truncate">{country.label}</span>
                <span class="ml-auto text-[10px] text-muted-foreground font-mono">{country.value}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
      {#if filters.country}
        <div class="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            class="w-full text-xs text-muted-foreground"
            onclick={() => handleCountrySelect("")}
          >
            Clear
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>

  <!-- Sort -->
  <Select.Root
    type="single"
    value={sortLocal}
    onValueChange={(v) => { if (v) { sortLocal = v as DirectoryFilters["sortBy"]; onSort(sortLocal, sortDirection); } }}
  >
    <Select.Trigger class="h-10 w-[130px] border-border bg-background text-xs" aria-label="Sort by">
      {sortLocal === 'name' ? 'Name' : sortLocal === 'url' ? 'URL' : sortLocal === 'lastChecked' ? 'Last Checked' : 'Latency'}
    </Select.Trigger>
    <Select.Content>
      <Select.Group>
        <Select.Item value="name">Name</Select.Item>
        <Select.Item value="url">URL</Select.Item>
        <Select.Item value="lastChecked">Last Checked</Select.Item>
        <Select.Item value="latency">Latency</Select.Item>
      </Select.Group>
    </Select.Content>
  </Select.Root>

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
