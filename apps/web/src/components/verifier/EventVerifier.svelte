<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import EventDetails from "./EventDetails.svelte";
import EventInput from "./EventInput.svelte";
import TagDecoder from "./TagDecoder.svelte";
import VerificationPanel from "./VerificationPanel.svelte";

let {
	onEditAndRepublish,
}: { onEditAndRepublish?: (event: NostrEvent) => void } = $props();

let event = $state<NostrEvent | null>(null);

function handleEvent(parsed: NostrEvent): void {
	event = parsed;
}
</script>

<div class="space-y-6 animate-fade-in">
  <EventInput onEvent={handleEvent} />

  {#if event}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-1">
        <VerificationPanel {event} {onEditAndRepublish} />
      </div>
      <div class="lg:col-span-1">
        <EventDetails {event} />
      </div>
      <div class="lg:col-span-1">
        <TagDecoder tags={event.tags} />
      </div>
    </div>
  {:else}
    <div
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-4"
      >
        <svg
          aria-hidden="true"
          class="w-8 h-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-text-primary mb-1">
        Paste a Nostr event JSON to verify
      </h2>
      <p class="text-sm text-text-muted max-w-sm">
        Verify signatures, decode tags, and inspect event fields — all
        client-side.
      </p>
    </div>
  {/if}
</div>
