<script lang="ts">
import { SectionCard } from "@relayscope/ui";
import { useAddRelay } from "../../lib/composables/useAddRelay.svelte";

let {
	relayUrl,
	relayName,
	inDirectory,
	onAdded,
	onInDirectoryChange,
}: {
	relayUrl: string;
	relayName?: string;
	inDirectory: boolean;
	onAdded?: (relayId: string) => void;
	onInDirectoryChange?: (inDir: boolean) => void;
} = $props();

let showForm = $state(false);

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const addRelayState = useAddRelay();

async function handleAdd() {
	const result = await addRelayState.add(relayUrl, relayName);

	if (addRelayState.success) {
		showForm = false;
		onInDirectoryChange?.(true);
		if (result?.id) {
			onAdded?.(result.id);
		}
	}
}

function cancel() {
	showForm = false;
	addRelayState.dismissError();
}
</script>

<!-- Already in directory -->
{#if inDirectory && !addRelayState.success}
  <div
    role="status"
    class="px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success flex items-center gap-2"
  >
    <svg
      aria-hidden="true"
      class="w-3.5 h-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <span>Already in directory</span>
  </div>
{:else if addRelayState.success}
  <!-- Success after adding -->
  <div
    role="status"
    class="px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success flex items-center gap-2"
  >
    <svg
      aria-hidden="true"
      class="w-3.5 h-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <span class="flex-1">Added to directory</span>
    <button
      type="button"
      onclick={() => addRelayState.dismissSuccess()}
      class="min-h-[44px] min-w-[44px] flex items-center justify-center text-success/60 hover:text-success transition-colors"
      aria-label="Dismiss"
    >
      <svg
        aria-hidden="true"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
{:else if !showForm}
  <!-- Add prompt (primary CTA — ephemeral, appears after inspection) -->
  <SectionCard className="animate-slide-up">
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <p class="text-sm text-text-primary font-medium">
          Save this relay to your directory?
        </p>
        <p class="text-xs text-text-muted mt-0.5 truncate">
          {relayUrl}
        </p>
      </div>
      <button
        type="button"
        onclick={() => (showForm = true)}
        class="min-h-[44px] px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shrink-0"
      >
        <svg
          aria-hidden="true"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add
      </button>
    </div>
  </SectionCard>
{:else}
  <!-- Add form (expanded) -->
  <SectionCard className="animate-slide-up">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleAdd();
      }}
      class="space-y-3"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-text-primary">Add to Directory</h3>
        <button
          type="button"
          onclick={cancel}
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          aria-label="Cancel"
        >
          <svg
            aria-hidden="true"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Error -->
      {#if addRelayState.error}
        <div
          role="alert"
          class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error"
        >
          <span aria-hidden="true">⚠</span> {addRelayState.error}
        </div>
      {/if}

      <!-- Submit -->
      <div class="flex gap-2">
        <button
          type="button"
          onclick={cancel}
          class="min-h-[44px] px-4 py-2.5 rounded-lg border border-dark-border text-sm text-text-muted hover:text-text-primary hover:border-dark-border/80 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addRelayState.submitting}
          class="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {#if addRelayState.submitting}
            <div
              class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
            ></div>
            Adding…
          {:else}
            <svg
              aria-hidden="true"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Relay
          {/if}
        </button>
      </div>
    </form>
  </SectionCard>
{/if}
