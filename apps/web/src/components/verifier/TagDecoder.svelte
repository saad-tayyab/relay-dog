<script lang="ts">
import * as Card from "$lib/components/ui/card";
import * as Empty from "$lib/components/ui/empty";
import { decodeTag } from "../../utils/nostrVerify";

let { tags }: { tags: string[][] } = $props();

const TAG_BADGE_COLORS: Record<string, string> = {
	e: "bg-blue-500/15 text-blue-400 border-blue-500/30",
	p: "bg-purple-500/15 text-purple-400 border-purple-500/30",
	t: "bg-green-500/15 text-green-400 border-green-500/30",
	d: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
	expiration: "bg-red-500/15 text-red-400 border-red-500/30",
	relay: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
	alt: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
	unknown: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};
const TAG_BADGE_DEFAULT = "bg-gray-500/15 text-gray-400 border-gray-500/30";

function getBadgeColor(type: string): string {
	return TAG_BADGE_COLORS[type] ?? TAG_BADGE_DEFAULT;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md space-y-3"><Card.Content class="p-5 lg:p-6">
  <h3 class="text-sm font-semibold text-text-primary">
    Tags
    {#if tags.length > 0}
      <span class="text-text-muted font-normal">({tags.length})</span>
    {/if}
  </h3>

  {#if tags.length === 0}
    <Empty.Root class="py-4">
      <Empty.Header>
        <Empty.Title class="text-xs">No tags</Empty.Title>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <div class="space-y-2">
      {#each tags as tag, i (i)}
        {@const decoded = decodeTag(tag)}
        <div
          class="flex items-start gap-2 p-2.5 rounded-lg bg-dark-surface border border-dark-border"
        >
          <span
            class="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded border {getBadgeColor(
              decoded.type,
            )}"
          >
            {decoded.label}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-text-secondary leading-relaxed break-all">
              {decoded.detail}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Card.Content></Card.Root>
