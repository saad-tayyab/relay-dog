<script lang="ts">
import { type Nip05Result, verifyNip05 } from '../../utils/nip05';
import SectionCard from '../SectionCard.svelte';

let identifier = $state('');
let expectedPubkey = $state('');
let checking = $state(false);
let result = $state<Nip05Result | null>(null);
let history = $state<Nip05Result[]>([]);

async function handleCheck() {
  if (!identifier.includes('@')) return;

  checking = true;
  result = null;

  try {
    result = await verifyNip05(identifier.trim(), expectedPubkey.trim() || undefined);

    // Add to history (keep last 5)
    history = [result, ...history.filter((h) => h.identifier !== result?.identifier)].slice(0, 5);
  } catch (e) {
    result = {
      identifier: identifier.trim(),
      local: identifier.split('@')[0],
      domain: identifier.split('@')[1],
      verified: false,
      resolvedPubkey: null,
      expectedPubkey: expectedPubkey.trim() || null,
      npub: null,
      httpStatus: null,
      responseTimeMs: 0,
      rawResponse: null,
      error: e instanceof Error ? e.message : 'Check failed',
    };
  } finally {
    checking = false;
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">NIP-05 Checker</h3>
      <span class="text-[10px] text-text-muted">NIP-05</span>
    </div>

    <!-- Input -->
    <div>
      <label for="nip05-input" class="block text-xs text-text-muted mb-1">
        NIP-05 Identifier
      </label>
      <input
        id="nip05-input"
        type="text"
        bind:value={identifier}
        placeholder="alice@example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Optional expected pubkey -->
    <div>
      <label for="expected-pubkey" class="block text-xs text-text-muted mb-1">
        Expected pubkey (optional)
      </label>
      <input
        id="expected-pubkey"
        type="text"
        bind:value={expectedPubkey}
        placeholder="64-char hex pubkey to verify against"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Check Button -->
    <button
      type="button"
      onclick={handleCheck}
      disabled={checking || !identifier.includes('@')}
      class="w-full px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {#if checking}
        Checking...
      {:else}
        Verify NIP-05
      {/if}
    </button>

    <!-- Result -->
    {#if result}
      <div class="space-y-3">
        <!-- Status -->
        <div
          class="px-3 py-2 rounded-lg text-xs {result.verified
            ? 'bg-success/10 border border-success/20 text-success'
            : 'bg-error/10 border border-error/20 text-error'}"
        >
          {#if result.verified}
            ✅ Verified — pubkey matches
          {:else if result.error}
            ❌ Failed — {result.error}
          {:else}
            ⚠️ Mismatch — pubkey doesn't match expected
          {/if}
        </div>

        <!-- Details -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-text-muted">Domain</span>
            <span class="text-text-primary font-mono">{result.domain}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">HTTP Status</span>
            <span class="text-text-primary font-mono">{result.httpStatus ?? '—'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Response Time</span>
            <span class="text-text-primary font-mono">{Math.round(result.responseTimeMs)}ms</span>
          </div>
        </div>

        <!-- Resolved Pubkey -->
        {#if result.resolvedPubkey}
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-text-muted">Resolved pubkey (hex)</span>
              <button
                type="button"
                onclick={() => copyToClipboard(result!.resolvedPubkey!)}
                class="text-[10px] text-accent hover:underline"
              >
                Copy
              </button>
            </div>
            <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
              {result.resolvedPubkey}
            </div>
          </div>

          {#if result.npub}
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-text-muted">npub</span>
                <button
                  type="button"
                  onclick={() => copyToClipboard(result!.npub!)}
                  class="text-[10px] text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
              <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-secondary break-all">
                {result.npub}
              </div>
            </div>
          {/if}
        {/if}

        <!-- Raw Response -->
        {#if result.rawResponse}
          <details class="group">
            <summary
              class="cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Raw JSON Response
            </summary>
            <pre class="mt-2 p-3 rounded-lg bg-dark-surface border border-dark-border text-[10px] text-text-secondary overflow-x-auto font-mono">{JSON.stringify(
                result.rawResponse,
                null,
                2,
              )}</pre>
          </details>
        {/if}
      </div>
    {/if}

    <!-- History -->
    {#if history.length > 0}
      <div class="border-t border-dark-border pt-3">
        <p class="text-[10px] text-text-muted mb-2">Recent checks</p>
        <div class="space-y-1">
          {#each history as item (item.identifier)}
            <button
              type="button"
              onclick={() => {
                identifier = item.identifier;
                handleCheck();
              }}
              class="flex items-center justify-between w-full px-2 py-1.5 rounded text-xs hover:bg-dark-surface transition-all"
            >
              <span class="text-text-secondary font-mono truncate">{item.identifier}</span>
              <span class={item.verified ? 'text-success' : 'text-error'}>
                {item.verified ? '✓' : '✗'}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</SectionCard>
