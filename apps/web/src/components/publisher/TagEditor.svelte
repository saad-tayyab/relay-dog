<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import TooltipWrap from "../shared/TooltipWrap.svelte";

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

let tagKey = $state("");
let tagValue = $state("");

const presetTags = [
	{ key: "e", label: "Event Reference", placeholder: "event ID" },
	{ key: "p", label: "Profile Reference", placeholder: "pubkey" },
	{ key: "t", label: "Hashtag", placeholder: "hashtag" },
	{ key: "d", label: "Replaceable Coordinate", placeholder: "coordinate" },
	{ key: "expiration", label: "Expiration", placeholder: "unix timestamp" },
	{ key: "relay", label: "Relay URL", placeholder: "wss://..." },
];

function handleAdd() {
	if (tagKey.trim()) {
		onAdd([tagKey.trim(), tagValue.trim()]);
		tagKey = "";
		tagValue = "";
	}
}

function handlePreset(key: string) {
	tagKey = key;
	tagValue = "";
}
</script>

<div class="space-y-3">
  <p class="block text-xs text-muted-foreground font-medium" id="tags-heading">Tags</p>

  <!-- Existing Tags -->
  {#if tags.length > 0}
    <div class="space-y-1">
      {#each tags as tag, i (i)}
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted border border-border">
          <span class="text-xs font-mono text-primary">{tag[0]}</span>
          {#if tag.length > 1 && tag[1]}
            <span class="text-xs font-mono text-muted-foreground truncate flex-1">{tag[1]}</span>
          {/if}
          <TooltipWrap label="Remove tag">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove tag"
              onclick={() => onRemove(i)}
              class="h-6 w-6 text-muted-foreground hover:text-error transition-colors"
            >
              <span aria-hidden="true">✕</span>
            </Button>
          </TooltipWrap>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Preset Buttons -->
  <div class="flex flex-wrap gap-1">
    {#each presetTags as preset (preset.key)}
      <Button
        variant="outline"
        size="sm"
        onclick={() => handlePreset(preset.key)}
        class="bg-muted text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
      >
        {preset.label}
      </Button>
    {/each}
  </div>

  <!-- Add Custom Tag -->
  <div class="flex gap-2">
    <label for="tag-key" class="sr-only">Tag Key</label>
    <Input
      id="tag-key"
      type="text"
      bind:value={tagKey}
      placeholder="Key"
      class="w-24 px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground"
    />
    <label for="tag-value" class="sr-only">Tag Value</label>
    <Input
      id="tag-value"
      type="text"
      bind:value={tagValue}
      placeholder="Value (optional)"
      class="flex-1 px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground"
    />
    <Button
      variant="default"
      size="sm"
      onclick={handleAdd}
      disabled={!tagKey.trim()}
      class="bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      Add
    </Button>
  </div>
</div>
