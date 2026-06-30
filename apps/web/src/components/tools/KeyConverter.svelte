<script lang="ts">
import { convertKey, detectKeyFormat } from '../../utils/keys';
import SectionCard from '../SectionCard.svelte';

let input = $state('');
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
    error = e instanceof Error ? e.message : 'Invalid key format';
  }
}

import { createClipboard } from '../../lib/composables/useCopyToClipboard.svelte';

const clipboard = createClipboard();

const detectedFormat = $derived(detectKeyFormat(input.trim()));
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Key Converter</h3>
      <span class="text-xs text-text-muted">NIP-19</span>
    </div>

    <!-- Input -->
    <div>
      <label for="key-input" class="block text-xs text-text-muted mb-1">
        Enter npub, nsec, or hex key
      </label>
      <input
        id="key-input"
        type="text"
        bind:value={input}
        oninput={handleConvert}
        placeholder="npub1... or nsec1... or 64-char hex"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono"
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
      <!-- npub -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted">npub</span>
          <button
            type="button"
            aria-label="Copy npub to clipboard"
            onclick={() => { if (result) clipboard.copy(result.npub); }}
            class="min-h-[44px] text-xs px-2 py-1 text-accent hover:underline"
          >
            {clipboard.copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
          {result.npub}
        </div>
      </div>

      <!-- nsec (with safety warning) -->
      {#if result.nsec}
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">nsec</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                aria-expanded={showNsec}
                onclick={() => (showNsec = !showNsec)}
                class="min-h-[44px] text-xs px-2 py-1 text-text-muted hover:text-text-primary"
              >
                {showNsec ? 'Hide' : 'Show'}
              </button>
              {#if showNsec}
                <button
                  type="button"
                  aria-label="Copy nsec to clipboard"
                  onclick={() => { if (result) clipboard.copy(result.nsec ?? ''); }}
                  class="min-h-[44px] text-xs px-2 py-1 text-accent hover:underline"
                >
                  {clipboard.copied ? '✓ Copied' : 'Copy'}
                </button>
              {/if}
            </div>
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
          <span class="text-xs text-text-muted">hex</span>
          <button
            type="button"
            aria-label="Copy hex key to clipboard"
            onclick={() => { if (result) clipboard.copy(result.hex); }}
            class="min-h-[44px] text-xs px-2 py-1 text-accent hover:underline"
          >
            {clipboard.copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
          {result.hex}
        </div>
      </div>
    {/if}
  </div>
</SectionCard>
