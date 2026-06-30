<script lang="ts">
import { useEventDeleter } from '../../lib/composables/useEventDeleter.svelte';
import SectionCard from '../SectionCard.svelte';

let { targetRelay }: { targetRelay: string } = $props();

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const deleter = useEventDeleter();
deleter.setTargetRelay(targetRelay);

let inputIds = $state('');

function handleAddIds() {
  const ids = inputIds
    .split(/[,\n]/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  for (const id of ids) {
    deleter.addEventId(id);
  }
  inputIds = '';
}

let confirmDelete = $state(false);

async function handleDelete() {
  if (!confirmDelete) {
    confirmDelete = true;
    return;
  }
  await deleter.deleteEvents();
  confirmDelete = false;
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Deleter</h3>
      <span class="text-[10px] text-text-muted">NIP-09</span>
    </div>

    <!-- Manual Input -->
    <div>
      <label for="event-ids" class="block text-xs text-text-muted mb-1">
        Event IDs (comma or newline separated)
      </label>
      <textarea
        id="event-ids"
        bind:value={inputIds}
        rows="3"
        placeholder="abc123..., def456..."
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all resize-none"
      ></textarea>
      <button
        type="button"
        onclick={handleAddIds}
        disabled={!inputIds.trim()}
        class="mt-2 px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Add IDs
      </button>
    </div>

    <!-- Event ID List -->
    {#if deleter.eventIds.length > 0}
      <div class="space-y-1">
        <p class="text-xs text-text-muted">
          {deleter.eventIds.length} event{deleter.eventIds.length !== 1 ? 's' : ''} to delete
        </p>
        <div class="max-h-32 overflow-y-auto space-y-1">
          {#each deleter.eventIds as id (id)}
            <div class="flex items-center justify-between px-2 py-1 rounded bg-dark-surface/50 text-xs">
              <span class="font-mono text-text-secondary truncate">{id}</span>
              <button
                type="button"
                aria-label="Remove event ID"
                onclick={() => deleter.removeEventId(id)}
                class="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-error transition-colors ml-2"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Reason -->
    <div>
      <label for="delete-reason" class="block text-xs text-text-muted mb-1">
        Reason (optional)
      </label>
      <input
        id="delete-reason"
        type="text"
        bind:value={deleter.reason}
        placeholder="Why are you deleting these events?"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Target Relay -->
    <div>
      <label for="delete-relay" class="block text-xs text-text-muted mb-1">Target Relay</label>
      <input
        id="delete-relay"
        type="text"
        bind:value={deleter.targetRelay}
        placeholder="wss://relay.example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Warning -->
    <div role="note" class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs text-warning">
      <span aria-hidden="true">⚠</span> Deletion is a request — relays may not honor it.
    </div>

    <!-- Confirmation Banner -->
    {#if confirmDelete}
      <div role="alert" class="p-3 bg-warning-dim border border-warning/30 rounded-lg text-xs">
        <p class="text-warning mb-2">
          Confirm deletion of {deleter.eventIds.length} event{deleter.eventIds.length !== 1 ? 's' : ''} from {deleter.targetRelay || 'relay'}?
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={handleDelete}
            disabled={deleter.deleting}
            class="min-h-[44px] px-4 py-2.5 bg-error text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {deleter.deleting ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button
            type="button"
            onclick={() => (confirmDelete = false)}
            class="min-h-[44px] px-4 py-2.5 bg-dark-surface border border-dark-border text-text-secondary text-xs rounded-lg hover:text-text-primary transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <!-- Delete Button -->
      <button
        type="button"
        aria-label={`Delete ${deleter.eventIds.length} events`}
        onclick={handleDelete}
        disabled={deleter.deleting || deleter.eventIds.length === 0 || !deleter.targetRelay}
        class="w-full min-h-[44px] px-4 py-3 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Delete {deleter.eventIds.length} Event{deleter.eventIds.length !== 1 ? 's' : ''}
      </button>
    {/if}

    <!-- Results -->
    {#if deleter.results.length > 0}
      <div role="status" aria-live="polite" class="space-y-1">
        <p class="text-xs text-text-muted">Results</p>
        {#each deleter.results as r (r.eventId)}
          <div
            class="px-2 py-1.5 rounded text-xs {r.success
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-error/10 border border-error/20 text-error'}"
          >
            <span class="font-mono">{r.eventId.slice(0, 12)}...</span>
            {#if r.success}
              ✅ Deleted
            {:else}
              ❌ {r.error}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</SectionCard>
