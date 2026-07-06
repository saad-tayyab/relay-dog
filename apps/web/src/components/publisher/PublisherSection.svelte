<script lang="ts">
import * as Tabs from "$lib/components/ui/tabs";
import EventComposer from "./EventComposer.svelte";
import EventDeleter from "./EventDeleter.svelte";

let {
	targetRelay,
	prefilledEvent,
}: {
	targetRelay: string;
	prefilledEvent?: unknown;
} = $props();

let activeTab = $state("compose");

// When a prefilled event arrives from the Verifier section, switch to compose tab
$effect(() => {
	if (prefilledEvent) {
		activeTab = "compose";
	}
});
</script>

<div class="flex flex-col gap-7">
  <Tabs.Root value={activeTab} onValueChange={(id) => (activeTab = id)} aria-label="Publisher tools">
    <Tabs.List variant="line" class="flex w-full gap-1 border-b border-border p-0">
      <Tabs.Trigger value="compose" class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:after:opacity-100 data-[state=active]:bg-card data-[state=active]:text-primary">
        <span aria-hidden="true">✍️</span> Compose
      </Tabs.Trigger>
      <Tabs.Trigger value="delete" class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:after:opacity-100 data-[state=active]:bg-card data-[state=active]:text-primary">
        <span aria-hidden="true">🗑️</span> Delete
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value={activeTab} class="pt-5 focus:outline-none">
    {#if activeTab === 'compose'}
      <EventComposer {targetRelay} {prefilledEvent} />
    {:else}
      <EventDeleter {targetRelay} />
    {/if}
    </Tabs.Content>
  </Tabs.Root>
</div>
