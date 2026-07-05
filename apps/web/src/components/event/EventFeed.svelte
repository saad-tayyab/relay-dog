<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import * as Card from "$lib/components/ui/card";
import * as Empty from "$lib/components/ui/empty";
import * as Item from "$lib/components/ui/item";
import * as ScrollArea from "$lib/components/ui/scroll-area";
import EventCard from "./EventCard.svelte";

let { events }: { events: NostrEvent[] } = $props();

let scrollEl = $state<HTMLElement | null>(null);
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

// Attach scroll handler to track user scroll position
$effect(() => {
	const el = scrollEl;
	if (!el) return;
	el.addEventListener("scroll", handleScroll, { passive: true });
	return () => el.removeEventListener("scroll", handleScroll);
});

// Auto-scroll when new events arrive
$effect(() => {
	const len = events.length;
	if (len > prevLength && shouldAutoScroll && scrollEl) {
		scrollEl.scrollTop = scrollEl.scrollHeight;
	}
	prevLength = len;
});
</script>

<Card.Root class="rounded-2xl">
  <Card.Header class="pb-3">
    <Card.Title>Event Feed</Card.Title>
    <Card.Description>{events.length.toLocaleString()} events</Card.Description>
  </Card.Header>
  <Card.Content class="p-0">
    {#if events.length === 0}
      <div class="px-5 pb-5">
        <Empty.Root class="py-8 text-center">
          <Empty.Header>
            <Empty.Title class="text-sm">No events yet</Empty.Title>
            <Empty.Description class="text-xs">Connect to a relay and send a filter to see events.</Empty.Description>
          </Empty.Header>
        </Empty.Root>
      </div>
    {:else}
      <ScrollArea.Root class="h-96" bind:viewportRef={scrollEl}>
        <Item.Group class="px-1 py-1">
          {#each events as event (event.id)}
            <EventCard {event} />
          {/each}
        </Item.Group>
      </ScrollArea.Root>
    {/if}
  </Card.Content>
</Card.Root>
