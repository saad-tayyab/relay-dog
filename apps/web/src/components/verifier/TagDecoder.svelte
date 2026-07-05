<script lang="ts">
import * as Card from "$lib/components/ui/card";
import * as Empty from "$lib/components/ui/empty";
import { decodeTag } from "../../utils/nostrVerify";

let { tags }: { tags: string[][] } = $props();

const TAG_BADGE_COLORS: Record<string, string> = {
	e: "bg-kind-note-dim text-kind-note border-kind-note/30",
	p: "bg-kind-dm-dim text-kind-dm border-kind-dm/30",
	t: "bg-kind-channel-dim text-kind-channel border-kind-channel/30",
	d: "bg-kind-metadata-dim text-kind-metadata border-kind-metadata/30",
	expiration: "bg-error-dim text-error border-error/20",
	relay: "bg-kind-channel-dim text-kind-channel border-kind-channel/30",
	alt: "bg-kind-metadata-dim text-kind-metadata border-kind-metadata/30",
	unknown: "bg-kind-unknown-dim text-kind-unknown border-kind-unknown/30",
};
const TAG_BADGE_DEFAULT = "bg-kind-unknown-dim text-kind-unknown border-kind-unknown/30";

function getBadgeColor(type: string): string {
	return TAG_BADGE_COLORS[type] ?? TAG_BADGE_DEFAULT;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="flex flex-col gap-3 p-5 lg:p-6">
  <h3 class="text-sm font-semibold text-foreground">
    Tags
    {#if tags.length > 0}
      <span class="text-muted-foreground font-normal">({tags.length})</span>
    {/if}
  </h3>

  {#if tags.length === 0}
    <Empty.Root class="py-4">
      <Empty.Header>
        <Empty.Title class="text-xs">No tags</Empty.Title>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <div class="flex flex-col gap-2">
      {#each tags as tag, i (i)}
        {@const decoded = decodeTag(tag)}
        <div
          class="flex items-start gap-2 p-2.5 rounded-lg bg-muted border border-border"
        >
          <span
            class="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded border {getBadgeColor(
              decoded.type,
            )}"
          >
            {decoded.label}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted-foreground leading-relaxed break-all">
              {decoded.detail}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Card.Content></Card.Root>
