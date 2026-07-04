<script lang="ts">
import { SectionCard } from "@relayscope/ui";

let { nips }: { nips: number[] } = $props();

const NIP_INFO: Record<number, { name: string; desc: string; color: string }> =
	{
		0: { name: "NIP-01", desc: "Basic protocol flow", color: "#60a5fa" },
		1: { name: "NIP-02", desc: "Contact List", color: "#60a5fa" },
		2: { name: "NIP-03", desc: "OpenTimestamps", color: "#60a5fa" },
		4: { name: "NIP-04", desc: "Encrypted Direct Messages", color: "#f472b6" },
		5: { name: "NIP-05", desc: "DNS-Based Identity", color: "#34d399" },
		9: { name: "NIP-09", desc: "Event Deletion", color: "#f87171" },
		11: { name: "NIP-11", desc: "Relay Information", color: "#c084fc" },
		12: { name: "NIP-12", desc: "Generic Tag Queries", color: "#60a5fa" },
		14: { name: "NIP-14", desc: "Subject Tag", color: "#60a5fa" },
		15: { name: "NIP-15", desc: "End of Stored Events", color: "#60a5fa" },
		16: { name: "NIP-16", desc: "Event Treatment", color: "#60a5fa" },
		17: { name: "NIP-17", desc: "Private DMs", color: "#f472b6" },
		18: { name: "NIP-18", desc: "Reposts", color: "#60a5fa" },
		19: { name: "NIP-19", desc: "Bech32 Encoded Entities", color: "#fbbf24" },
		20: { name: "NIP-20", desc: "Command Results", color: "#60a5fa" },
		21: { name: "NIP-21", desc: "nostr: URI Scheme", color: "#fbbf24" },
		22: { name: "NIP-22", desc: "Event Created At", color: "#60a5fa" },
		23: { name: "NIP-23", desc: "Long-form Content", color: "#34d399" },
		24: { name: "NIP-24", desc: "Extra Event Tags", color: "#60a5fa" },
		25: { name: "NIP-25", desc: "Reactions", color: "#fb923c" },
		28: { name: "NIP-28", desc: "Public Chat", color: "#60a5fa" },
		33: { name: "NIP-33", desc: "Parameterized Replaceable", color: "#60a5fa" },
		40: { name: "NIP-40", desc: "Expiration Timestamp", color: "#60a5fa" },
		42: { name: "NIP-42", desc: "Relay Authentication", color: "#f87171" },
		44: { name: "NIP-44", desc: "Versioned Encryption", color: "#f472b6" },
		45: { name: "NIP-45", desc: "Counting Events", color: "#60a5fa" },
		50: { name: "NIP-50", desc: "Keywords Filter", color: "#34d399" },
		51: { name: "NIP-51", desc: "Lists", color: "#fb923c" },
		52: { name: "NIP-52", desc: "Calendar Events", color: "#fb923c" },
		53: { name: "NIP-53", desc: "Live Activities", color: "#fb923c" },
		56: { name: "NIP-56", desc: "Reporting", color: "#f87171" },
		57: { name: "NIP-57", desc: "Zaps", color: "#fbbf24" },
		58: { name: "NIP-58", desc: "Badges", color: "#fb923c" },
		59: { name: "NIP-59", desc: "Gift Wrapping", color: "#f472b6" },
		60: { name: "NIP-60", desc: "Cashu Wallets", color: "#fbbf24" },
		61: { name: "NIP-61", desc: "Nutzap", color: "#fbbf24" },
		62: { name: "NIP-62", desc: "Request to Wallet", color: "#fbbf24" },
		65: { name: "NIP-65", desc: "Relay List Metadata", color: "#34d399" },
		66: { name: "NIP-66", desc: "Relay Discovery", color: "#34d399" },
		78: { name: "NIP-78", desc: "Application-specific Data", color: "#60a5fa" },
	};

const nipLink = (n: number) =>
	`https://github.com/nostr-protocol/nips/blob/master/${String(n).padStart(2, "0")}.md`;

const sortedNips = $derived([...nips].sort((a, b) => a - b));
</script>

{#if nips && nips.length > 0}
  <SectionCard className="animate-fade-in">
    <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
      Supported NIPs ({nips.length})
    </h3>
    <div class="flex flex-wrap gap-2">
      {#each sortedNips as n (n)}
        {@const info = NIP_INFO[n]}
        <a
          href={nipLink(n)}
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
          style="background-color: {info?.color || '#60a5fa'}15; color: {info?.color || '#60a5fa'}; border: 1px solid {info?.color || '#60a5fa'}30"
          title={info?.desc || `NIP-${n}`}
        >
          <span class="font-bold">NIP-{n}</span>
          {#if info?.desc}
            <span class="hidden sm:inline opacity-70">· {info.desc}</span>
          {/if}
          <svg
            aria-hidden="true"
            class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
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
        </a>
      {/each}
    </div>
  </SectionCard>
{/if}
