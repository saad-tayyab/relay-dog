<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Collapsible from "$lib/components/ui/collapsible";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { useClipboard } from "../../lib/composables/useCopyToClipboard.svelte";
import { jsonHighlight } from "../../utils/jsonHighlight";
import { type Nip05Result, verifyNip05 } from "../../utils/nip05";

let identifier = $state("");
let expectedPubkey = $state("");
let checking = $state(false);
let result = $state<Nip05Result | null>(null);
let history = $state<Nip05Result[]>([]);
let rawJsonOpen = $state(false);

async function handleCheck() {
	if (!identifier.includes("@")) return;

	checking = true;
	result = null;

	const [local, domain] = identifier.split("@") as [string, string];
	try {
		result = await verifyNip05(
			identifier.trim(),
			expectedPubkey.trim() || undefined,
		);

		// Add to history (keep last 5)
		history = [
			result,
			...history.filter((h) => h.identifier !== result?.identifier),
		].slice(0, 5);
	} catch (e) {
		result = {
			identifier: identifier.trim(),
			local,
			domain,
			verified: false,
			resolvedPubkey: null,
			expectedPubkey: expectedPubkey.trim() || null,
			npub: null,
			httpStatus: null,
			responseTimeMs: 0,
			rawResponse: null,
			error: e instanceof Error ? e.message : "Check failed",
		};
	} finally {
		checking = false;
	}
}

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const clipboard = useClipboard();
</script>

<Card.Root class="rounded-xl border-border bg-card">
  <Card.Content class="flex flex-col gap-4 p-4">
    <!-- Screen reader live region for copy feedback -->
    <div aria-live="polite" class="sr-only">
      {clipboard.copied ? 'Copied to clipboard' : ''}
      {clipboard.error ? clipboard.error : ''}
    </div>

    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">NIP-05 Checker</h3>
      <Badge variant="outline" class="border-border bg-muted text-muted-foreground">NIP-05</Badge>
    </div>

    <!-- Input -->
    <div>
      <Label for="nip05-input" class="mb-1 block text-xs text-muted-foreground">
        NIP-05 Identifier
      </Label>
      <Input
        id="nip05-input"
        type="text"
        bind:value={identifier}
        placeholder="alice@example.com"
        aria-describedby="nip05-hint"
        class="h-11 border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>

    <!-- Optional expected pubkey -->
    <div>
      <Label for="expected-pubkey" class="mb-1 block text-xs text-muted-foreground">
        Expected pubkey (optional)
      </Label>
      <Input
        id="expected-pubkey"
        type="text"
        bind:value={expectedPubkey}
        placeholder="64-char hex pubkey to verify against"
        class="h-11 border-border bg-muted px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
      />
    </div>

    <!-- Check Button -->
    <Button
      variant="default"
      onclick={handleCheck}
      disabled={checking || !identifier.includes('@')}
      aria-describedby={identifier.length > 0 && !identifier.includes('@') ? 'nip05-hint' : undefined}
      class="min-h-[44px] w-full"
    >
      {#if checking}
        Checking...
      {:else}
        Verify NIP-05
      {/if}
    </Button>

    {#if !identifier.includes('@') && identifier.length > 0}
      <p id="nip05-hint" class="text-xs text-warning" role="status">
        NIP-05 identifier must contain @ (e.g., user@example.com)
      </p>
    {/if}

    <!-- Result -->
    {#if result}
      <div class="flex flex-col gap-3">
        <!-- Status -->
        <div
          role="status"
          class="px-3 py-2 rounded-lg text-xs {result.verified
            ? 'bg-success-dim border border-success/20 text-success'
            : 'bg-error-dim border border-error/20 text-error'}"
        >
          {#if result.verified}
            <span aria-hidden="true">✓</span> Verified — pubkey matches
          {:else if result.error}
            <span aria-hidden="true">✕</span> Failed — {result.error}
          {:else}
            <span aria-hidden="true">⚠</span> Mismatch — pubkey doesn't match expected
          {/if}
        </div>

        <!-- Details -->
        <div class="flex flex-col gap-2 text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Domain</span>
            <span class="text-foreground font-mono">{result.domain}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">HTTP Status</span>
            <span class="text-foreground font-mono">{result.httpStatus ?? '—'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Response Time</span>
            <span class="text-foreground font-mono">{Math.round(result.responseTimeMs)}ms</span>
          </div>
        </div>

        <!-- Resolved Pubkey -->
        {#if result.resolvedPubkey}
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Resolved pubkey (hex)</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy to clipboard"
                onclick={() => result?.resolvedPubkey && clipboard.copy(result.resolvedPubkey)}
                class="min-h-[44px] text-xs text-primary"
              >
                {clipboard.copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <div class="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground break-all">
              {result.resolvedPubkey}
            </div>
          </div>

          {#if result.npub}
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">npub</span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Copy to clipboard"
                  onclick={() => result?.npub && clipboard.copy(result.npub)}
                  class="min-h-[44px] text-xs text-primary"
                >
                  {clipboard.copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <div class="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground break-all">
                {result.npub}
              </div>
            </div>
          {/if}
        {/if}

        <!-- Raw Response -->
        {#if result.rawResponse}
          <Collapsible.Root bind:open={rawJsonOpen}>
            <Collapsible.Trigger
              class="cursor-pointer text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              Raw JSON Response
            </Collapsible.Trigger>
             <Collapsible.Content>
               <pre class="mt-2 p-4 rounded-lg bg-muted border border-border text-xs text-muted-foreground overflow-x-auto font-mono">{@html jsonHighlight(JSON.stringify(result.rawResponse, null, 2))}</pre>
            </Collapsible.Content>
          </Collapsible.Root>
        {/if}
      </div>
    {/if}

    <!-- History -->
    {#if history.length > 0}
      <div class="border-t border-border pt-3">
        <p class="text-xs text-muted-foreground mb-2">Recent checks</p>
      <ul class="flex flex-col gap-1">
        {#each history as item (item.identifier)}
          <li>
            <Button
              variant="ghost"
              onclick={() => {
                identifier = item.identifier;
                handleCheck();
              }}
              class="w-full justify-between text-xs hover:bg-muted"
            >
              <span class="text-muted-foreground font-mono truncate">{item.identifier}</span>
              <span class={item.verified ? 'text-success' : 'text-error'} aria-hidden="true">
                {item.verified ? '✓' : '✗'}
              </span>
              <span class="sr-only">{item.verified ? 'Verified' : 'Not verified'}</span>
            </Button>
          </li>
        {/each}
      </ul>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
