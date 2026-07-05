<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import * as Accordion from "$lib/components/ui/accordion";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { toNpub } from "../../utils/nostrVerify";
import TooltipWrap from "../shared/TooltipWrap.svelte";
import KindBadge from "./KindBadge.svelte";

let { event }: { event: NostrEvent } = $props();

let contentExpanded = $state(false);
let copiedId = $state(false);
let copiedPubkey = $state(false);

const npub = $derived(toNpub(event.pubkey));

const relativeTime = $derived(formatRelativeTime(event.created_at));
const absoluteTime = $derived(formatAbsoluteTime(event.created_at));
const contentTooLong = $derived(event.content.length > 500);
const displayedContent = $derived(
	contentTooLong && !contentExpanded
		? `${event.content.slice(0, 500)}…`
		: event.content,
);

function formatRelativeTime(createdAt: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - createdAt;

	if (diff < 0 || diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
	return `${Math.floor(diff / 604800)} weeks ago`;
}

function formatAbsoluteTime(createdAt: number): string {
	return new Date(createdAt * 1000).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

async function copyToClipboard(
	text: string,
	which: "id" | "pubkey",
): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		if (which === "id") {
			copiedId = true;
			setTimeout(() => (copiedId = false), 1500);
		} else {
			copiedPubkey = true;
			setTimeout(() => (copiedPubkey = false), 1500);
		}
	} catch {
		// Clipboard API may be denied
	}
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md space-y-4"><Card.Content class="p-5 lg:p-6">
  <h3 class="text-sm font-semibold text-foreground">Event Details</h3>

  <!-- Screen reader live region for copy feedback -->
  <div aria-live="polite" class="sr-only">
    {copiedId ? 'Event ID copied to clipboard' : ''}
    {copiedPubkey ? 'Pubkey copied to clipboard' : ''}
  </div>

  <dl class="space-y-4">
    <!-- Kind — always visible -->
    <div>
      <dt class="text-xs text-muted-foreground mb-1">Kind</dt>
      <dd><KindBadge kind={event.kind} /></dd>
    </div>

    <!-- Created At — always visible -->
    <div>
      <dt class="text-xs text-muted-foreground mb-1">Created At</dt>
      <dd class="text-sm text-muted-foreground">
        <time datetime={new Date(event.created_at * 1000).toISOString()}>{relativeTime}</time>
        <span class="text-muted-foreground ml-1.5">({absoluteTime})</span>
      </dd>
    </div>

    <!-- Collapsible sections via Accordion -->
    <Accordion.Root type="multiple" class="space-y-2">
      <!-- ID -->
      <Accordion.Item value="id" class="rounded-lg border border-border">
        <Accordion.Trigger class="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:no-underline">
          Event ID
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-3">
          <div class="flex items-center gap-2 mb-1">
            <TooltipWrap label="Copy event ID">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy event ID to clipboard"
                onclick={() => copyToClipboard(event.id, 'id')}
                class="text-muted-foreground hover:text-primary transition-colors gap-1"
              >
                {#if copiedId}
                  <svg aria-hidden="true" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                {:else}
                  <svg aria-hidden="true" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                {/if}
              </Button>
            </TooltipWrap>
          </div>
          <p class="text-xs font-mono text-muted-foreground break-all" title={event.id}>
            {event.id}
          </p>
        </Accordion.Content>
      </Accordion.Item>

      <!-- Pubkey -->
      <Accordion.Item value="pubkey" class="rounded-lg border border-border">
        <Accordion.Trigger class="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:no-underline">
          Pubkey
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-3">
          <div class="flex items-center gap-2 mb-1">
            <TooltipWrap label="Copy pubkey">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy pubkey to clipboard"
                onclick={() => copyToClipboard(event.pubkey, 'pubkey')}
                class="text-muted-foreground hover:text-primary transition-colors gap-1"
              >
                {#if copiedPubkey}
                  <svg aria-hidden="true" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                {:else}
                  <svg aria-hidden="true" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                {/if}
              </Button>
            </TooltipWrap>
          </div>
          <p class="text-xs font-mono text-muted-foreground break-all" title={event.pubkey}>
            {event.pubkey}
          </p>
          <p class="text-xs font-mono text-primary mt-0.5" title={npub}>
            {npub}
          </p>
        </Accordion.Content>
      </Accordion.Item>

      <!-- Content -->
      <Accordion.Item value="content" class="rounded-lg border border-border">
        <Accordion.Trigger class="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:no-underline">
          Content ({event.content.length} chars)
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-3">
          <dd
            class="p-3 rounded-lg bg-muted border border-border text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed"
          >
            {displayedContent}
          </dd>
          {#if contentTooLong}
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={contentExpanded}
              onclick={() => (contentExpanded = !contentExpanded)}
              class="text-primary hover:text-primary/80 transition-colors mt-1.5"
            >
              {contentExpanded ? 'Show less' : `Show all (${event.content.length} chars)`}
            </Button>
          {/if}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  </dl>
</Card.Content></Card.Root>
