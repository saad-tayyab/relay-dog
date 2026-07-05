<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import { SectionCard } from "@/components/shared/ui";
import EventCard from "./EventCard.svelte";

let { events }: { events: NostrEvent[] } = $props();

let scrollEl = $state<HTMLOListElement | null>(null);
let shouldAutoScroll = $state(true);
let prevLength = $state(0);

function handleScroll() {
	const el = scrollEl;
	if (!el) return;
	const threshold = 50;
	const isNearBottom =
		el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
	shouldAutoScroll = isNearBottom;
}

// Auto-scroll when new events arrive
$effect(() => {
	const len = events.length;
	if (len > prevLength && shouldAutoScroll && scrollEl) {
		scrollEl.scrollTop = scrollEl.scrollHeight;
	}
	prevLength = len;
});
</script>

<SectionCard className="flex flex-col">
  <!-- Event count header -->
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-text-primary">Event Feed</h3>
    <span class="text-xs font-mono text-text-muted">
      {events.length.toLocaleString()} events
    </span>
  </div>

  <!-- Event list -->
  {#if events.length === 0}
    <div class="text-center py-10 text-text-muted text-xs">
      No events yet. Subscribe with a filter to start receiving events.
    </div>
  {:else}
    <ol
      bind:this={scrollEl}
      onscroll={handleScroll}
      class="max-h-96 overflow-y-auto overflow-x-hidden"
    >
      {#each events as event (event.id)}
        <li><EventCard {event} /></li>
      {/each}
    </ol>
  {/if}
</SectionCard>
