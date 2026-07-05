<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as ScrollArea from "$lib/components/ui/scroll-area";
import { parseExpiration } from "../../utils/relay";
import TooltipWrap from "../shared/TooltipWrap.svelte";
import ExpiredBadge from "./ExpiredBadge.svelte";

let { event }: { event: NostrEvent } = $props();

let expanded = $state(false);
let copied = $state(false);

const KIND_COLORS: Record<number, string> = {
	0: "bg-blue-500/15 text-blue-400 border-blue-500/30",
	1: "bg-green-500/15 text-green-400 border-green-500/30",
	4: "bg-purple-500/15 text-purple-400 border-purple-500/30",
	42: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const KIND_LABELS: Record<number, string> = {
	0: "Metadata",
	1: "Note",
	4: "DM",
	42: "Channel",
};

function getKindColor(kind: number): string {
	return KIND_COLORS[kind] || "bg-gray-500/15 text-gray-400 border-gray-500/30";
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
</script>

<article class="border-b border-dark-border last:border-b-0 py-3 px-2">
  <!-- Header row -->
  <div class="flex items-center gap-2 mb-1.5">
    <Badge class="text-xs font-medium px-1.5 py-0.5 border {kindColor}">
      {kindLabel}
    </Badge>
    <ExpiredBadge expirationInfo={expirationInfo} />
    <span class="text-xs font-mono text-text-muted" title={event.pubkey}>
      {truncatePubkey(event.pubkey)}
    </span>
    <time class="text-xs text-text-muted ml-auto shrink-0" datetime={new Date(event.created_at * 1000).toISOString()}>{timestamp}</time>
  </div>

  <!-- Content preview -->
  {#if event.content}
    <p class="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
      {contentPreview}
    </p>
  {/if}

  <!-- Screen reader live region for copy feedback -->
  <div aria-live="polite" class="sr-only">
    {copied ? 'Event JSON copied to clipboard' : ''}
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2 mt-2">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onclick={() => (expanded = !expanded)}
      class="h-auto px-0 text-xs text-muted-foreground hover:text-primary"
    >
      <svg
        aria-hidden="true"
        class="w-3 h-3 transition-transform {expanded ? 'rotate-90' : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      {expanded ? 'Collapse' : 'Raw JSON'}
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onclick={handleCopy}
      class="h-auto px-0 text-xs text-muted-foreground hover:text-primary"
    >
      {#if copied}
        <svg
          aria-hidden="true"
          class="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Copied
      {:else}
        <svg
          aria-hidden="true"
          class="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Copy
      {/if}
    </Button>
  </div>

  <!-- Expanded JSON -->
  {#if expanded}
    <ScrollArea.Root class="mt-2 max-h-64">
      <pre
        class="p-4 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-secondary overflow-x-auto font-mono leading-relaxed">{JSON.stringify(
          event,
          null,
          2,
        )}</pre>
    </ScrollArea.Root>
  {/if}
</article>
