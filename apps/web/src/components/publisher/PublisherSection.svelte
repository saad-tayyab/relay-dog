<script lang="ts">
import EventComposer from './EventComposer.svelte';
import EventDeleter from './EventDeleter.svelte';

let {
  targetRelay,
  prefilledEvent,
}: {
  targetRelay: string;
  prefilledEvent?: unknown;
} = $props();

let activeTab = $state<'compose' | 'delete'>('compose');

// Apply prefill if provided
$effect(() => {
  if (prefilledEvent && activeTab === 'compose') {
    // The EventComposer will handle the prefill via its own effect
  }
});
</script>

<div class="space-y-4">
  <!-- Tab Toggle -->
  <div class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
    <button
      type="button"
      onclick={() => (activeTab = 'compose')}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'compose'
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      ✍️ Compose
    </button>
    <button
      type="button"
      onclick={() => (activeTab = 'delete')}
      class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'delete'
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      🗑️ Delete
    </button>
  </div>

  <!-- Content -->
  {#if activeTab === 'compose'}
    <EventComposer {targetRelay} />
  {:else}
    <EventDeleter {targetRelay} />
  {/if}
</div>
