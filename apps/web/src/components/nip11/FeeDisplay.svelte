<script lang="ts">
import type { RelayFees } from "@relayscope/shared";
import * as Card from "$lib/components/ui/card";

let { fees }: { fees: RelayFees | null } = $props();

function formatAmount(amount: number, unit: string): string {
	if (unit === "msats") {
		return `${(amount / 1000).toFixed(2)} sats`;
	}
	return `${amount} sats`;
}
</script>

{#if fees}
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
    <h3 class="text-sm font-semibold text-text-primary mb-3">Fees</h3>
    <div class="space-y-2">
      {#if fees.admission && fees.admission.length > 0}
        <div>
          <p class="text-xs text-text-muted mb-1">Admission Fee</p>
          {#each fees.admission as entry (entry.amount)}
            <div
              class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dark-surface border border-dark-border"
            >
              <span class="text-xs text-text-primary">{formatAmount(entry.amount, entry.unit)}</span
              >
              {#if entry.period}
                <span class="text-xs text-text-muted">/ {entry.period}s</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if fees.subscription && fees.subscription.length > 0}
        <div>
          <p class="text-xs text-text-muted mb-1">Subscription Fee</p>
          {#each fees.subscription as entry (entry.amount)}
            <div
              class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dark-surface border border-dark-border"
            >
              <span class="text-xs text-text-primary">{formatAmount(entry.amount, entry.unit)}</span
              >
              {#if entry.period}
                <span class="text-xs text-text-muted">/ {entry.period}s</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if fees.publication && fees.publication.length > 0}
        <div>
          <p class="text-xs text-text-muted mb-1">Publication Fee</p>
          {#each fees.publication as entry (entry.amount)}
            <div
              class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dark-surface border border-dark-border"
            >
              <span class="text-xs text-text-primary">{formatAmount(entry.amount, entry.unit)}</span
              >
              {#if entry.kinds}
                <span class="text-xs text-text-muted">(kinds: {entry.kinds.join(', ')})</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Content></Card.Root>
{/if}
