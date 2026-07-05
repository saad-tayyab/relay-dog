<script lang="ts">
import CheckIcon from "@lucide/svelte/icons/check";
import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
import CopyIcon from "@lucide/svelte/icons/copy";
import type { NostrEvent } from "@relayscope/shared";
import * as Avatar from "$lib/components/ui/avatar";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Item from "$lib/components/ui/item";
import * as ScrollArea from "$lib/components/ui/scroll-area";
import { parseExpiration } from "../../utils/relay";
import TooltipWrap from "../shared/TooltipWrap.svelte";
import ExpiredBadge from "./ExpiredBadge.svelte";

let { event }: { event: NostrEvent } = $props();

let expanded = $state(false);
let copied = $state(false);

const KIND_COLORS: Record<number, string> = {
	0: "bg-kind-metadata-dim text-kind-metadata border-kind-metadata/30",
	1: "bg-kind-note-dim text-kind-note border-kind-note/30",
	4: "bg-kind-dm-dim text-kind-dm border-kind-dm/30",
	42: "bg-kind-channel-dim text-kind-channel border-kind-channel/30",
};

const KIND_LABELS: Record<number, string> = {
	0: "Metadata",
	1: "Note",
	4: "DM",
	42: "Channel",
};

function getKindColor(kind: number): string {
	return KIND_COLORS[kind] || "bg-kind-unknown-dim text-kind-unknown border-kind-unknown/30";
}

function getKindLabel(kind: number): string {
	return KIND_LABELS[kind] || `Kind ${kind}`;
}

function formatRelativeTime(createdAt: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - createdAt;

	if (diff < 0 || diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
	return new Date(createdAt * 1000).toLocaleDateString();
}

function truncatePubkey(pubkey: string): string {
	if (pubkey.length <= 8) return pubkey;
	return `${pubkey.slice(0, 8)}…`;
}

function truncateContent(content: string, maxLen = 200): string {
	if (content.length <= maxLen) return content;
	return `${content.slice(0, maxLen)}…`;
}

/** Derive a deterministic color from a hex pubkey for the avatar fallback.
 *  Uses 33% lightness in OKLCH to guarantee ≥4.5:1 contrast with white text (SC 1.4.3). */
function pubkeyColor(pubkey: string): string {
	const hash = Number.parseInt(pubkey.slice(0, 8), 16);
	const hue = hash % 360;
	return `oklch(0.33 0.12 ${hue})`;
}

/** Format a tag array into a short display string */
function tagDisplay(tag: string[]): string {
	const key = tag[0] ?? "";
	const val = tag.length > 1 ? (tag[1] ?? "") : "";
	if (!val) return key;
	const truncated = val.length > 24 ? `${val.slice(0, 24)}…` : val;
	return `${key}:${truncated}`;
}

async function handleCopy() {
	try {
		await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
		copied = true;
		setTimeout(() => (copied = false), 1500);
	} catch {
		// Clipboard API may be denied
	}
}



const kindColor = $derived(getKindColor(event.kind));
const kindLabel = $derived(getKindLabel(event.kind));
const timestamp = $derived(formatRelativeTime(event.created_at));
const contentPreview = $derived(truncateContent(event.content));
const expirationInfo = $derived(parseExpiration(event.tags));
const avatarBg = $derived(pubkeyColor(event.pubkey));
const displayTags = $derived(event.tags.slice(0, 5));
const remainingTagCount = $derived(event.tags.length - 5);
</script>

<Item.Root variant="outline" size="sm">
  <Item.Media>
    <Avatar.Root class="size-8">
      <Avatar.Fallback
        class="text-[10px] font-mono text-white"
        style="background-color: {avatarBg}"
      >
        {event.pubkey.slice(0, 2).toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
  </Item.Media>

  <Item.Content>
    <!-- Title: kind badge + pubkey + timestamp -->
    <Item.Title>
      <Badge class="text-[10px] font-medium px-1.5 py-0 border {kindColor}">
        {kindLabel}
      </Badge>
      <ExpiredBadge {expirationInfo} />
      <span class="text-muted-foreground font-mono text-[10px] ml-1 truncate" title={event.pubkey}>
        {truncatePubkey(event.pubkey)}
      </span>
      <time
        class="ml-auto text-[10px] text-muted-foreground shrink-0"
        datetime={new Date(event.created_at * 1000).toISOString()}
      >
        {timestamp}
      </time>
    </Item.Title>

    <!-- Description: content preview (line-clamp-2 built into Item.Description) -->
    {#if event.content}
      <Item.Description>{contentPreview}</Item.Description>
    {/if}

    <!-- Tags -->
    {#if displayTags.length > 0}
      <div class="flex flex-wrap items-center gap-1 mt-1">
        {#each displayTags as tag (tag.join(","))}
          <Badge
            variant="outline"
            class="text-[9px] px-1.5 py-0 font-mono text-muted-foreground"
          >
            {tagDisplay(tag)}
          </Badge>
        {/each}
        {#if remainingTagCount > 0}
          <span class="text-[9px] text-muted-foreground">
            +{remainingTagCount}
          </span>
        {/if}
      </div>
    {/if}
  </Item.Content>

  <Item.Actions>
    <TooltipWrap label={expanded ? "Collapse JSON" : "Show raw JSON"}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-expanded={expanded}
        onclick={() => (expanded = !expanded)}
        class="size-7 text-muted-foreground hover:text-primary"
      >
        <ChevronRightIcon class="size-3.5 transition-transform {expanded ? "rotate-90" : ""}" aria-hidden="true" />
      </Button>
    </TooltipWrap>
    <TooltipWrap label={copied ? "Copied!" : "Copy event JSON"}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onclick={handleCopy}
        class="size-7 text-muted-foreground hover:text-primary"
      >
        {#if copied}
          <CheckIcon class="size-3.5" aria-hidden="true" />
        {:else}
          <CopyIcon class="size-3.5" aria-hidden="true" />
        {/if}
      </Button>
    </TooltipWrap>
  </Item.Actions>
</Item.Root>

<!-- Screen reader live region for copy feedback -->
<div aria-live="polite" class="sr-only">
  {copied ? "Event JSON copied to clipboard" : ""}
</div>

<!-- Expanded JSON -->
{#if expanded}
  <div class="ml-10.5 mr-3.5 mt-1.5">
    <ScrollArea.Root class="h-64">
      <pre
        class="p-4 rounded-lg bg-muted border border-border text-xs text-muted-foreground overflow-x-auto font-mono leading-relaxed">{JSON.stringify(
          event,
          null,
          2,
        )}</pre>
    </ScrollArea.Root>
  </div>
{/if}
