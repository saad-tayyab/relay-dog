<script lang="ts">
import type { RelayLimitation } from '@relayscope/shared';
import SectionCard from './SectionCard.svelte';

let { limitation }: { limitation: RelayLimitation | undefined } = $props();

interface FeeRow {
  label: string;
  value: string | null;
}

const fees = $derived.by((): FeeRow[] => {
  if (!limitation) return [];

  const rows: FeeRow[] = [];

  // admission: number — admission fee in sats
  if (typeof limitation.admission === 'number') {
    rows.push({ label: 'Admission Fee', value: `${limitation.admission} sats` });
  }

  // subscription: object with tiers
  if (limitation.subscription && typeof limitation.subscription === 'object') {
    const sub = limitation.subscription as Record<string, unknown>;
    if (typeof sub.rate === 'number') {
      rows.push({
        label: 'Subscription Rate',
        value: `${sub.rate} sats/${sub.period ?? 'period'}`,
      });
    }
  }

  // per_event: number — per-event cost
  if (typeof limitation.per_event === 'number') {
    rows.push({ label: 'Per Event', value: `${limitation.per_event} sats` });
  }

  // payment_required boolean
  if (limitation.payment_required === true && rows.length === 0) {
    rows.push({ label: 'Payment Required', value: 'See relay website for pricing' });
  }

  return rows;
});

const hasFees = $derived(fees.length > 0);
</script>

{#if hasFees}
  <SectionCard>
    <h3 class="text-sm font-semibold text-text-primary mb-3">💰 Fees</h3>
    <div class="space-y-2">
      {#each fees as fee (fee.label)}
        <div
          class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dark-surface border border-dark-border"
        >
          <span class="text-xs text-text-muted">{fee.label}</span>
          <span class="text-xs font-mono font-medium text-text-primary">{fee.value}</span>
        </div>
      {/each}
    </div>
  </SectionCard>
{/if}
