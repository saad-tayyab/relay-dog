<script lang="ts">
import type { Snippet } from "svelte";
import * as Tooltip from "$lib/components/ui/tooltip";

let { label, children }: { label: string; children: Snippet } = $props();
</script>

<Tooltip.Provider delayDuration={300}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {@render children()}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p class="text-xs">{label}</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
