<script lang="ts">
import { SectionCard } from "@relayscope/ui";
import { useEventComposer } from "../../lib/composables/useEventComposer.svelte";
import TagEditor from "./TagEditor.svelte";

let {
	targetRelay,
	prefilledEvent,
	onPublishComplete,
}: {
	targetRelay: string;
	prefilledEvent?: unknown;
	onPublishComplete?: (result: {
		success: boolean;
		eventId?: string;
		error?: string;
		latencyMs: number;
	}) => void;
} = $props();

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const composer = useEventComposer();

$effect(() => {
	composer.setTargetRelay(targetRelay);
});

// Prefill event data from Verifier "Edit & Re-publish" flow
$effect(() => {
	if (prefilledEvent) {
		composer.prefill(prefilledEvent);
	}
});

const commonKinds = [
	{ kind: 0, label: "Metadata" },
	{ kind: 1, label: "Note" },
	{ kind: 3, label: "Contacts" },
	{ kind: 5, label: "Deletion" },
	{ kind: 7, label: "Reaction" },
	{ kind: 27676, label: "Long-form" },
];

const charCount = $derived(composer.state.content.length);
const maxChars = $derived(10000); // Default, could come from NIP-11
const isOverLimit = $derived(charCount > maxChars);

async function handlePublish() {
	const result = await composer.publish();
	onPublishComplete?.(result);
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Composer</h3>
      <span class="text-xs text-text-muted">NIP-01, NIP-07</span>
    </div>

    <!-- Kind Selector -->
    <div>
      <label for="kind-input" class="block text-xs text-text-muted mb-1">Kind</label>
      <div class="flex gap-1 mb-2">
        {#each commonKinds as k (k.kind)}
          <button
            type="button"
            aria-pressed={composer.state.kind === k.kind}
            onclick={() => composer.setKind(k.kind)}
            class="min-h-[44px] px-3 py-2 rounded text-xs transition-all {composer.state.kind === k.kind
              ? 'bg-accent text-white'
              : 'bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary'}"
          >
            {k.label}
          </button>
        {/each}
      </div>
      <input
        id="kind-input"
        type="number"
        min="0"
        value={composer.state.kind}
        oninput={(e) => composer.setKind(Number((e.target as HTMLInputElement).value))}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-all font-mono"
      />
    </div>

    <!-- Content -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <label for="event-content" class="text-xs text-text-muted">Content</label>
        <span class="text-xs {isOverLimit ? 'text-error' : 'text-text-muted'}">
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>
      <textarea
        id="event-content"
        bind:value={composer.state.content}
        rows="6"
        placeholder="Event content..."
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all resize-none"
      ></textarea>
    </div>

    <!-- Tags -->
    <TagEditor
      tags={composer.state.tags}
      onAdd={(tag) => composer.addTag(tag)}
      onRemove={(i) => composer.removeTag(i)}
      onUpdate={(i, tag) => composer.updateTag(i, tag)}
    />

    <!-- Created At -->
    <div>
      <label for="created-at" class="block text-xs text-text-muted mb-1">Created At</label>
      <input
        id="created-at"
        type="datetime-local"
        value={new Date(composer.state.createdAt * 1000).toISOString().slice(0, 16)}
        oninput={(e) => {
          const val = (e.target as HTMLInputElement).value;
          composer.setCreatedAt(Math.floor(new Date(val).getTime() / 1000));
        }}
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Target Relay -->
    <div>
      <label for="target-relay" class="block text-xs text-text-muted mb-1">Target Relay</label>
      <input
        id="target-relay"
        type="text"
        bind:value={composer.state.targetRelay}
        placeholder="wss://relay.example.com"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
      />
    </div>

    <!-- Publish Button -->
    <button
      type="button"
      aria-label={composer.publishing ? 'Publishing event...' : 'Sign and publish event'}
      aria-busy={composer.publishing}
      onclick={handlePublish}
      disabled={composer.publishing || !composer.state.targetRelay || isOverLimit}
      class="w-full min-h-[44px] px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {#if composer.publishing}
        <span class="flex items-center justify-center gap-2">
          <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          Publishing...
        </span>
      {:else}
        Sign & Publish
      {/if}
    </button>

    <!-- Result -->
    {#if composer.result}
      <div
        role="status"
        class="px-3 py-2 rounded-lg text-xs {composer.result.success
          ? 'bg-success-dim border border-success/20 text-success'
          : 'bg-error-dim border border-error/20 text-error'}"
      >
        {#if composer.result.success}
          <span aria-hidden="true">✓</span> Published! Event ID: <span class="font-mono">{composer.result.eventId}</span>
          <span class="text-text-muted ml-2">({Math.round(composer.result.latencyMs)}ms)</span>
        {:else}
          <span aria-hidden="true">✕</span> {composer.result.error}
        {/if}
      </div>
    {/if}
  </div>
</SectionCard>
