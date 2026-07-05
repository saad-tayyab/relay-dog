<script lang="ts">
import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
import XCircleIcon from "@lucide/svelte/icons/circle-x";
import type { NostrEvent } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import {
	eventIdMatches,
	toNpub,
	verifySignature,
} from "../../utils/nostrVerify";

let {
	event,
	onEditAndRepublish,
}: { event: NostrEvent; onEditAndRepublish?: (event: NostrEvent) => void } =
	$props();

const sigResult = $derived(verifySignature(event));
const idResult = $derived(eventIdMatches(event));
const npub = $derived(toNpub(event.pubkey));

function truncateHex(hex: string, chars = 8): string {
	if (hex.length <= chars * 2) return hex;
	return `${hex.slice(0, chars)}…${hex.slice(-chars)}`;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="flex flex-col gap-4 p-5 lg:p-6">
  <h3 class="text-sm font-semibold text-foreground">Verification</h3>

  <!-- Signature check -->
  <div
    role="status"
    class="flex items-start gap-3 p-3 rounded-lg {sigResult
      ? 'bg-success-dim border border-success/20'
      : 'bg-error-dim border border-error/20'}"
  >
    <div class="shrink-0 mt-0.5">
      {#if sigResult}
        <CheckCircleIcon class="size-5 text-success" aria-hidden="true" />
      {:else}
        <XCircleIcon class="size-5 text-error" aria-hidden="true" />
      {/if}
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium {sigResult ? 'text-success' : 'text-error'}">
        Signature {sigResult ? 'Valid' : 'Invalid'}
      </p>
      <p class="text-xs text-muted-foreground mt-0.5">
        Schnorr signature verification (NIP-01)
      </p>
    </div>
  </div>

  <!-- Event ID check -->
  <div
    role="status"
    class="flex items-start gap-3 p-3 rounded-lg {idResult.matches
      ? 'bg-success-dim border border-success/20'
      : 'bg-error-dim border border-error/20'}"
  >
    <div class="shrink-0 mt-0.5">
      {#if idResult.matches}
        <CheckCircleIcon class="size-5 text-success" aria-hidden="true" />
      {:else}
        <XCircleIcon class="size-5 text-error" aria-hidden="true" />
      {/if}
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium {idResult.matches ? 'text-success' : 'text-error'}">
        Event ID {idResult.matches ? 'Match' : 'Mismatch'}
      </p>
      <p class="text-xs text-muted-foreground mt-0.5">
        SHA-256 of canonical serialization
      </p>
      {#if !idResult.matches}
        <div class="mt-2 flex flex-col gap-1">
          <div class="text-xs">
            <span class="text-muted-foreground">Stored: </span>
            <code class="font-mono text-error">{truncateHex(event.id)}</code>
          </div>
          <div class="text-xs">
            <span class="text-muted-foreground">Computed: </span>
            <code class="font-mono text-success">{truncateHex(idResult.computed)}</code>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Signing pubkey -->
  <div class="p-3 rounded-lg bg-muted border border-border">
    <p class="text-xs text-muted-foreground mb-1">Signing Public Key</p>
    <p class="text-xs font-mono text-muted-foreground break-all" title={event.pubkey}>
      {event.pubkey}
    </p>
    <p class="text-xs font-mono text-primary mt-1" title={npub}>
      {npub}
    </p>
  </div>

  <!-- Edit & Re-publish -->
  {#if onEditAndRepublish}
    <Button
      variant="outline"
      size="sm"
      aria-label="Edit and republish this event"
      onclick={() => onEditAndRepublish(event)}
      class="w-full bg-muted text-foreground hover:text-primary hover:border-primary/30 transition-all"
    >
      <span aria-hidden="true">✍️</span> Edit & Re-publish
    </Button>
  {/if}
</Card.Content></Card.Root>
