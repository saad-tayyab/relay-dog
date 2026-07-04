<script lang="ts">
import { apiUrl } from '../utils/api';
import SectionCard from './SectionCard.svelte';

let { onAdded }: { onAdded?: () => void } = $props();

let showForm = $state(false);
let url = $state('');
let name = $state('');
let apiKey = $state('');
let submitting = $state(false);
let error = $state<string | null>(null);
let success = $state<string | null>(null);

// Load saved API key from localStorage
$effect(() => {
  const saved = localStorage.getItem('relayscope_api_key');
  if (saved) apiKey = saved;
});

async function handleSubmit() {
  if (!url.trim() || submitting) return;

  submitting = true;
  error = null;
  success = null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey.trim()) {
      headers.Authorization = `Bearer ${apiKey.trim()}`;
      // Save for future use
      localStorage.setItem('relayscope_api_key', apiKey.trim());
    }

    const res = await fetch(apiUrl('/api/relays'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: url.trim(),
        name: name.trim() || undefined,
        isPublic: true,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const json = await res.json();

    if (json.success) {
      success = `Added "${json.data.name || json.data.url}" successfully`;
      url = '';
      name = '';
      showForm = false;
      onAdded?.();
    } else if (res.status === 409) {
      error = 'This relay is already in the directory';
    } else if (res.status === 401) {
      error = 'Unauthorized — check your API key';
    } else {
      error = json.error || 'Failed to add relay';
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to add relay';
  } finally {
    submitting = false;
  }
}

function cancel() {
  showForm = false;
  error = null;
  success = null;
}
</script>

<div class="space-y-3">
  <!-- Success message -->
  {#if success}
    <div
      role="status"
      class="px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success flex items-center gap-2"
    >
      <span aria-hidden="true">✓</span> {success}
    </div>
  {/if}

  <!-- Toggle Button -->
  {#if !showForm}
    <button
      type="button"
      onclick={() => (showForm = true)}
      class="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-dashed border-dark-border text-sm text-text-muted hover:text-accent hover:border-accent-border transition-all flex items-center justify-center gap-2"
    >
      <span aria-hidden="true">+</span> Add Relay
    </button>
  {/if}

  <!-- Add Relay Form -->
  {#if showForm}
    <SectionCard>
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text-primary">Add Relay</h3>
          <button
            type="button"
            onclick={cancel}
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Cancel"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <!-- Error -->
        {#if error}
          <div
            role="alert"
            class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error"
          >
            <span aria-hidden="true">⚠</span> {error}
          </div>
        {/if}

        <!-- URL -->
        <div>
          <label for="add-relay-url" class="block text-xs text-text-muted mb-1">
            Relay URL <span class="text-error">*</span>
          </label>
          <input
            id="add-relay-url"
            type="text"
            bind:value={url}
            placeholder="wss://relay.example.com"
            required
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <!-- Name -->
        <div>
          <label for="add-relay-name" class="block text-xs text-text-muted mb-1">
            Name <span class="text-text-muted">(optional)</span>
          </label>
          <input
            id="add-relay-name"
            type="text"
            bind:value={name}
            placeholder="My Relay"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <!-- API Key -->
        <div>
          <label for="add-relay-apikey" class="block text-xs text-text-muted mb-1">
            API Key <span class="text-text-muted">(saved locally)</span>
          </label>
          <input
            id="add-relay-apikey"
            type="password"
            bind:value={apiKey}
            placeholder="Required for production"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          class="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {#if submitting}
            <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            Adding…
          {:else}
            Add Relay
          {/if}
        </button>
      </form>
    </SectionCard>
  {/if}
</div>
