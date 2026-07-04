<script lang="ts">
import { AccessibleTabs } from "@relayscope/ui";
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

<div class="space-y-7">
  <AccessibleTabs
    ariaLabel="Publisher tools"
    tabs={[
      { id: 'compose', label: 'Compose', icon: '✍️' },
      { id: 'delete', label: 'Delete', icon: '🗑️' },
    ]}
    {activeTab}
    onTabChange={(id) => (activeTab = id)}
  >
    {#if activeTab === 'compose'}
      <EventComposer {targetRelay} {prefilledEvent} />
    {:else}
      <EventDeleter {targetRelay} />
    {/if}
  </AccessibleTabs>
</div>
