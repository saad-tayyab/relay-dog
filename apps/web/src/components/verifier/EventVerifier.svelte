<script lang="ts">
import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
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

<div class="flex flex-col gap-7 animate-fade-in">
  <EventInput onEvent={handleEvent} />

  {#if event}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        class="size-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4"
      >
        <ShieldCheckIcon class="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 class="text-lg font-semibold text-foreground mb-1">
        Paste a Nostr event JSON to verify
      </h2>
      <p class="text-sm text-muted-foreground max-w-sm">
        Verify signatures, decode tags, and inspect event fields — all
        client-side.
      </p>
    </div>
  {/if}
</div>
