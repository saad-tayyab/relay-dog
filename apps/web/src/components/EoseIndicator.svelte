<script lang="ts">
import type { EoseResult } from '@relayscope/shared';

let { eoseResult }: { eoseResult: EoseResult | null } = $props();
</script>

{#if eoseResult}
  <div
    class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all
    {eoseResult.complete
      ? 'bg-success/10 border border-success/20 text-success'
      : 'bg-warning/10 border border-warning/20 text-warning'}"
  >
    {#if eoseResult.complete}
      <span>✓</span>
      <span>All stored events received</span>
    {:else}
      <span>⚠</span>
      <span>More events available — use older filters to paginate</span>
    {/if}
  </div>
{/if}
