<script lang="ts">
import { Alert, AlertDescription } from "$lib/components/ui/alert";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Spinner } from "$lib/components/ui/spinner";
import { useAddRelay } from "../../lib/composables/useAddRelay.svelte";
import TooltipWrap from "../shared/TooltipWrap.svelte";

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
  <Alert role="status" class="text-xs">
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
    <AlertDescription>Already in directory</AlertDescription>
  </Alert>
{:else if addRelayState.success}
  <!-- Success after adding -->
  <Alert role="status" class="text-xs">
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
    <AlertDescription class="flex-1">Added to directory</AlertDescription>
    <TooltipWrap label="Dismiss">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onclick={() => addRelayState.dismissSuccess()}
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
      </Button>
    </TooltipWrap>
  </Alert>
{:else if !showForm}
  <!-- Add prompt (primary CTA — ephemeral, appears after inspection) -->
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-slide-up"><Card.Content class="p-5 lg:p-6">
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <p class="text-sm text-foreground font-medium">
          Save this relay to your directory?
        </p>
        <p class="text-xs text-muted-foreground mt-0.5 truncate">
          {relayUrl}
        </p>
      </div>
      <Button
        type="button"
        variant="default"
        onclick={() => (showForm = true)}
        class="min-h-[44px] shrink-0 px-4 py-2 text-sm font-semibold"
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
      </Button>
    </div>
  </Card.Content></Card.Root>
{:else}
  <!-- Add form (expanded) -->
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-slide-up"><Card.Content class="p-5 lg:p-6">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleAdd();
      }}
      class="space-y-3"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-foreground">Add to Directory</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onclick={cancel}
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
        </Button>
      </div>

      <!-- Error -->
      {#if addRelayState.error}
        <Alert variant="destructive" class="text-xs">
          <AlertDescription><span aria-hidden="true">⚠</span> {addRelayState.error}</AlertDescription>
        </Alert>
      {/if}

      <!-- Submit -->
      <div class="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onclick={cancel}
          class="min-h-[44px] px-4 py-2.5 text-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={addRelayState.submitting}
          class="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold"
        >
          {#if addRelayState.submitting}
            <Spinner class="size-4" />
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
        </Button>
      </div>
    </form>
  </Card.Content></Card.Root>
{/if}
