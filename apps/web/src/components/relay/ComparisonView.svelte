<script lang="ts">
import type { DirectoryRelay } from "@relayscope/shared";
import { SectionCard } from "@relayscope/ui";

let {
	relayA,
	relayB,
	diff,
	onClose,
}: {
	relayA: DirectoryRelay;
	relayB: DirectoryRelay;
	diff: {
		nipsOnlyInA: number[];
		nipsOnlyInB: number[];
		sharedNips: number[];
		latencyWinner: "A" | "B" | "tie";
		healthWinner: "A" | "B" | "tie";
	};
	onClose: () => void;
} = $props();

function winnerClass(winner: "A" | "B" | "tie", side: "A" | "B"): string {
	if (winner === "tie") return "";
	if (winner === side) return "text-success";
	return "text-error";
}

function latencyDisplay(relay: DirectoryRelay): string {
	return relay.lastDiscovery?.rttOpen != null
		? `${relay.lastDiscovery.rttOpen}ms`
		: "—";
}

function healthStatus(relay: DirectoryRelay): string {
	if (
		relay.lastDiscovery != null &&
		Date.now() - new Date(relay.lastDiscovery.discoveredAt).getTime() <
			24 * 60 * 60 * 1000
	) {
		return "Online";
	}
	return "Unknown";
}
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-text-primary">Relay Comparison</h3>
    <button
      type="button"
      aria-label="Close comparison view"
      onclick={onClose}
      class="min-h-[44px] min-w-[44px] text-xs px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary transition-all"
    >
      <span aria-hidden="true">✕</span> Close
    </button>
  </div>

  <!-- Relay Headers -->
  <div class="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayA.name || 'Unknown'}</h4>
      <p class="text-xs text-text-muted font-mono truncate" title={relayA.url}>{relayA.url}</p>
    </div>
    <div class="text-text-muted text-xs self-center">vs</div>
    <div class="text-center">
      <h4 class="text-sm font-semibold text-text-primary">{relayB.name || 'Unknown'}</h4>
      <p class="text-xs text-text-muted font-mono truncate" title={relayB.url}>{relayB.url}</p>
    </div>
  </div>

  <!-- Comparison Table -->
  <table class="w-full border-separate border-spacing-y-2" aria-label="Comparison results">
    <caption class="sr-only">Comparison between {relayA.name || 'Relay A'} and {relayB.name || 'Relay B'}</caption>
    <thead class="sr-only">
      <tr>
        <th scope="col">{relayA.name || 'Relay A'}</th>
        <th scope="col">Metric</th>
        <th scope="col">{relayB.name || 'Relay B'}</th>
      </tr>
    </thead>
    <tbody>
      <!-- Health -->
      <tr class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
        <td class="text-xs text-center {winnerClass(diff.healthWinner, 'A')}">
          {healthStatus(relayA)}
        </td>
        <th scope="row" class="text-xs text-text-muted text-center font-normal">Health</th>
        <td class="text-xs text-center {winnerClass(diff.healthWinner, 'B')}">
          {healthStatus(relayB)}
        </td>
      </tr>

      <!-- Latency -->
      <tr class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
        <td class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'A')}">
          {latencyDisplay(relayA)}
        </td>
        <th scope="row" class="text-xs text-text-muted text-center font-normal">Latency</th>
        <td class="text-xs text-center font-mono {winnerClass(diff.latencyWinner, 'B')}">
          {latencyDisplay(relayB)}
        </td>
      </tr>

      <!-- NIP Count -->
      <tr class="grid grid-cols-[1fr_auto_1fr] gap-4 py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
        <td class="text-xs text-center font-mono text-text-primary">
          {relayA.supportedNips.length}
        </td>
        <th scope="row" class="text-xs text-text-muted text-center font-normal">NIPs</th>
        <td class="text-xs text-center font-mono text-text-primary">
          {relayB.supportedNips.length}
        </td>
      </tr>

      <!-- Shared NIPs -->
      <tr>
        <td colspan="3" class="py-2 px-3 rounded-lg bg-dark-surface border border-dark-border block text-center">
          <span class="text-xs text-text-muted block mb-1">Shared NIPs</span>
          <span class="text-xs text-text-secondary font-mono">
            {diff.sharedNips.length > 0 ? diff.sharedNips.join(', ') : 'None'}
          </span>
        </td>
      </tr>

      <!-- NIPs only in A -->
      {#if diff.nipsOnlyInA.length > 0}
        <tr>
          <td colspan="3" class="py-2 px-3 rounded-lg bg-accent-dim border border-accent-border block text-center">
            <span class="text-xs text-accent block mb-1">Only in {relayA.name || 'A'}</span>
            <span class="text-xs text-accent font-mono">
              {diff.nipsOnlyInA.join(', ')}
            </span>
          </td>
        </tr>
      {/if}

      <!-- NIPs only in B -->
      {#if diff.nipsOnlyInB.length > 0}
        <tr>
          <td colspan="3" class="py-2 px-3 rounded-lg bg-accent-dim border border-accent-border block text-center">
            <span class="text-xs text-accent block mb-1">Only in {relayB.name || 'B'}</span>
            <span class="text-xs text-accent font-mono">
              {diff.nipsOnlyInB.join(', ')}
            </span>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</SectionCard>
