<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { useClipboard } from "../../lib/composables/useCopyToClipboard.svelte";
import { convertKey, detectKeyFormat } from "../../utils/keys";

let input = $state("");
let result = $state<{
	npub: string;
	nsec: string | null;
	hex: string;
	format: string;
} | null>(null);
let error = $state<string | null>(null);
let showNsec = $state(false);

function handleConvert() {
	if (!input.trim()) {
		result = null;
		error = null;
		return;
	}

	try {
		result = convertKey(input.trim());
		error = null;
		showNsec = false;
	} catch (e) {
		result = null;
		error = e instanceof Error ? e.message : "Invalid key format";
	}
}

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const clipboard = useClipboard();

const detectedFormat = $derived(detectKeyFormat(input.trim()));
</script>

<Card.Root class="rounded-xl border-dark-border bg-dark-card">
  <Card.Content class="space-y-4 p-4">
    <!-- Screen reader live region for copy feedback -->
    <div aria-live="polite" class="sr-only">
      {clipboard.copied ? 'Copied to clipboard' : ''}
      {clipboard.error ? clipboard.error : ''}
    </div>

    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Key Converter</h3>
      <Badge variant="outline" class="border-dark-border bg-dark-surface text-text-muted">NIP-19</Badge>
    </div>

    <!-- Input -->
    <div>
      <Label for="key-input" class="mb-1 block text-xs text-text-muted">
        Enter npub, nsec, or hex key
      </Label>
      <Input
        id="key-input"
        type="text"
        bind:value={input}
        oninput={handleConvert}
        placeholder="npub1... or nsec1... or 64-char hex"
        class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-sm text-text-primary placeholder:text-text-muted"
      />
      {#if detectedFormat !== 'unknown' && input.trim()}
        <p class="mt-1 text-xs text-text-muted">
          Detected: <span class="text-accent">{detectedFormat}</span>
        </p>
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
        ⚠ {error}
      </div>
    {/if}

    <!-- Results -->
    {#if result}
      <dl class="space-y-3">
        <!-- npub -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-text-muted">npub</dt>
            <dd>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy npub to clipboard"
                onclick={() => { if (result) clipboard.copy(result.npub); }}
                class="min-h-[44px] text-xs text-accent"
              >
                {clipboard.copied ? '✓ Copied' : 'Copy'}
              </Button>
            </dd>
          </div>
          <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
            {result.npub}
          </div>
        </div>

        <!-- nsec (with safety warning) -->
        {#if result.nsec}
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <dt class="text-xs text-text-muted">nsec</dt>
              <dd class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={showNsec}
                  onclick={() => (showNsec = !showNsec)}
                  class="min-h-[44px] text-xs text-text-muted hover:text-text-primary"
                >
                  {showNsec ? 'Hide' : 'Show'}
                </Button>
                {#if showNsec}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Copy nsec to clipboard"
                    onclick={() => { if (result) clipboard.copy(result.nsec ?? ''); }}
                    class="min-h-[44px] text-xs text-accent"
                  >
                    {clipboard.copied ? '✓ Copied' : 'Copy'}
                  </Button>
                {/if}
              </dd>
            </div>
            {#if showNsec}
              <div class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs font-mono text-warning break-all">
                <span aria-hidden="true">⚠</span> {result.nsec}
              </div>
              <p class="text-xs text-warning" role="alert">
                <span aria-hidden="true">⚠</span> Never share your nsec with anyone!
              </p>
            {:else}
              <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-muted">
                ••••••••••••••••••••••••••••••••
              </div>
            {/if}
          </div>
        {/if}

        <!-- hex -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-text-muted">hex</dt>
            <dd>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy hex key to clipboard"
                onclick={() => { if (result) clipboard.copy(result.hex); }}
                class="min-h-[44px] text-xs text-accent"
              >
                {clipboard.copied ? '✓ Copied' : 'Copy'}
              </Button>
            </dd>
          </div>
          <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
            {result.hex}
          </div>
        </div>
      </dl>
    {/if}
  </Card.Content>
</Card.Root>
