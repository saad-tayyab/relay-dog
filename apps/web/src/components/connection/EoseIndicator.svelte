<script lang="ts">
import type { EoseResult } from "@relayscope/shared";

let { eoseResult }: { eoseResult: EoseResult | null } = $props();
</script>

{#if eoseResult}
  <div
    role="status"
    class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all
    {eoseResult.complete
      ? 'bg-success-dim border border-success/20 text-success'
      : 'bg-warning-dim border border-warning/20 text-warning'}"
  >
    {#if eoseResult.complete}
      <span aria-hidden="true">✓</span>
      <span>All stored events received</span>
    {:else}
      <span aria-hidden="true">⚠</span>
      <span>More events available — use older filters to paginate</span>
    {/if}
  </div>
{/if}
