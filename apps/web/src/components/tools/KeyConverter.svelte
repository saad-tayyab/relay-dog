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

<Card.Root class="rounded-xl border-border bg-card">
  <Card.Content class="flex flex-col gap-4 p-4">
    <!-- Screen reader live region for copy feedback -->
    <div aria-live="polite" class="sr-only">
      {clipboard.copied ? 'Copied to clipboard' : ''}
      {clipboard.error ? clipboard.error : ''}
    </div>

    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">Key Converter</h3>
      <Badge variant="outline" class="border-border bg-muted text-muted-foreground">NIP-19</Badge>
    </div>

    <!-- Input -->
    <div>
      <Label for="key-input" class="mb-1 block text-xs text-muted-foreground">
        Enter npub, nsec, or hex key
      </Label>
      <Input
        id="key-input"
        type="text"
        bind:value={input}
        oninput={handleConvert}
        placeholder="npub1... or nsec1... or 64-char hex"
        aria-describedby={detectedFormat !== 'unknown' && input.trim() ? 'key-format-hint' : undefined}
        class="h-11 border-border bg-muted px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />
      {#if detectedFormat !== 'unknown' && input.trim()}
        <p id="key-format-hint" class="mt-1 text-xs text-muted-foreground">
          Detected: <span class="text-primary">{detectedFormat}</span>
        </p>
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
        <span aria-hidden="true">⚠</span> {error}
      </div>
    {/if}

    <!-- Results -->
    {#if result}
      <dl class="flex flex-col gap-3">
        <!-- npub -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">npub</dt>
            <dd>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy npub to clipboard"
                onclick={() => { if (result) clipboard.copy(result.npub); }}
                class="min-h-[44px] text-xs text-primary"
              >
                {clipboard.copied ? '✓ Copied' : 'Copy'}
              </Button>
            </dd>
          </div>
          <div class="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground break-all">
            {result.npub}
          </div>
        </div>

        <!-- nsec (with safety warning) -->
        {#if result.nsec}
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <dt class="text-xs text-muted-foreground">nsec</dt>
              <dd class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={showNsec}
                  onclick={() => (showNsec = !showNsec)}
                  class="min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
                >
                  {showNsec ? 'Hide' : 'Show'}
                </Button>
                {#if showNsec}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Copy nsec to clipboard"
                    onclick={() => { if (result) clipboard.copy(result.nsec ?? ''); }}
                    class="min-h-[44px] text-xs text-primary"
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
              <div class="px-3 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground">
                ••••••••••••••••••••••••••••••••
              </div>
            {/if}
          </div>
        {/if}

        <!-- hex -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">hex</dt>
            <dd>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Copy hex key to clipboard"
                onclick={() => { if (result) clipboard.copy(result.hex); }}
                class="min-h-[44px] text-xs text-primary"
              >
                {clipboard.copied ? '✓ Copied' : 'Copy'}
              </Button>
            </dd>
          </div>
          <div class="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground break-all">
            {result.hex}
          </div>
        </div>
      </dl>
    {/if}
  </Card.Content>
</Card.Root>
