<script lang="ts">
let {
  tags,
  onAdd,
  onRemove,
  onUpdate: _onUpdate,
}: {
  tags: string[][];
  onAdd: (tag: string[]) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, tag: string[]) => void;
} = $props();

let tagKey = $state('');
let tagValue = $state('');

const presetTags = [
  { key: 'e', label: 'Event Reference', placeholder: 'event ID' },
  { key: 'p', label: 'Profile Reference', placeholder: 'pubkey' },
  { key: 't', label: 'Hashtag', placeholder: 'hashtag' },
  { key: 'd', label: 'Replaceable Coordinate', placeholder: 'coordinate' },
  { key: 'expiration', label: 'Expiration', placeholder: 'unix timestamp' },
  { key: 'relay', label: 'Relay URL', placeholder: 'wss://...' },
];

function handleAdd() {
  if (tagKey.trim()) {
    onAdd([tagKey.trim(), tagValue.trim()]);
    tagKey = '';
    tagValue = '';
  }
}

function handlePreset(key: string) {
  tagKey = key;
  tagValue = '';
}
</script>

<div class="space-y-3">
  <p class="block text-xs text-text-muted font-medium" id="tags-heading">Tags</p>

  <!-- Existing Tags -->
  {#if tags.length > 0}
    <div class="space-y-1">
      {#each tags as tag, i (i)}
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border">
          <span class="text-xs font-mono text-accent">{tag[0]}</span>
          {#if tag.length > 1 && tag[1]}
            <span class="text-xs font-mono text-text-secondary truncate flex-1">{tag[1]}</span>
          {/if}
          <button
            type="button"
            aria-label="Remove tag"
            onclick={() => onRemove(i)}
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-error transition-colors"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Preset Buttons -->
  <div class="flex flex-wrap gap-1">
    {#each presetTags as preset (preset.key)}
      <button
        type="button"
        onclick={() => handlePreset(preset.key)}
        class="min-h-[44px] px-3 py-2 rounded text-xs bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <!-- Add Custom Tag -->
  <div class="flex gap-2">
    <label for="tag-key" class="sr-only">Tag Key</label>
    <input
      id="tag-key"
      type="text"
      bind:value={tagKey}
      placeholder="Key"
      class="w-24 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
    <label for="tag-value" class="sr-only">Tag Value</label>
    <input
      id="tag-value"
      type="text"
      bind:value={tagValue}
      placeholder="Value (optional)"
      class="flex-1 px-2 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
    />
    <button
      type="button"
      onclick={handleAdd}
      disabled={!tagKey.trim()}
      class="min-h-[44px] px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      Add
    </button>
  </div>
</div>
