<script lang="ts">
import AccessibleTabs from '../shared/AccessibleTabs.svelte';
import EventComposer from './EventComposer.svelte';
import EventDeleter from './EventDeleter.svelte';

let {
  targetRelay,
  prefilledEvent: _prefilledEvent,
}: {
  targetRelay: string;
  prefilledEvent?: unknown;
} = $props();

let activeTab = $state('compose');
</script>

<div class="space-y-4">
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
      <EventComposer {targetRelay} />
    {:else}
      <EventDeleter {targetRelay} />
    {/if}
  </AccessibleTabs>
</div>
