<script lang="ts">
import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { Spinner } from "$lib/components/ui/spinner";
import { Textarea } from "$lib/components/ui/textarea";
import * as ToggleGroup from "$lib/components/ui/toggle-group";
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

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">Event Composer</h3>
      <Badge variant="outline" class="text-xs text-muted-foreground">NIP-01, NIP-07</Badge>
    </div>

    <!-- Kind Selector -->
    <div>
      <Label for="kind-input" class="mb-1 block text-xs text-muted-foreground">Kind</Label>
      <ToggleGroup.Root type="single" value={String(composer.state.kind)} onValueChange={(v) => { if (v) composer.setKind(Number(v)); }} class="mb-2 flex flex-wrap">
        {#each commonKinds as k (k.kind)}
          <ToggleGroup.Item value={String(k.kind)}>
            {k.label}
          </ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
      <Input
        id="kind-input"
        type="number"
        min="0"
        value={composer.state.kind}
        oninput={(e) => composer.setKind(Number((e.target as HTMLInputElement).value))}
        class="h-11 border-border bg-card px-3 font-mono text-sm text-foreground"
      />
    </div>

    <!-- Content -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <Label for="event-content" class="text-xs text-muted-foreground">Content</Label>
        <span class="text-xs {isOverLimit ? 'text-error' : 'text-muted-foreground'}">
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>
      <Textarea
        id="event-content"
        bind:value={composer.state.content}
        rows={6}
        placeholder="Event content..."
        class="border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
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
      <Label for="created-at" class="mb-1 block text-xs text-muted-foreground">Created At</Label>
      <Input
        id="created-at"
        type="datetime-local"
        value={new Date(composer.state.createdAt * 1000).toISOString().slice(0, 16)}
        oninput={(e) => {
          const val = (e.target as HTMLInputElement).value;
          composer.setCreatedAt(Math.floor(new Date(val).getTime() / 1000));
        }}
        class="h-11 border-border bg-card px-3 text-sm text-foreground [color-scheme:dark]"
      />
    </div>

    <!-- Target Relay -->
    <div>
      <Label for="target-relay" class="mb-1 block text-xs text-muted-foreground">Target Relay</Label>
      <Input
        id="target-relay"
        type="text"
        bind:value={composer.state.targetRelay}
        placeholder="wss://relay.example.com"
        class="h-11 border-border bg-card px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>

    <!-- Publish Button -->
    <Button
      type="button"
      variant="default"
      aria-label={composer.publishing ? 'Publishing event...' : 'Sign and publish event'}
      aria-busy={composer.publishing}
      onclick={handlePublish}
      disabled={composer.publishing || !composer.state.targetRelay || isOverLimit}
      class="min-h-[44px] w-full px-4 py-3 text-sm font-semibold"
    >
      {#if composer.publishing}
        <span class="flex items-center justify-center gap-2">
          <Spinner class="size-4" />
          Publishing...
        </span>
      {:else}
        Sign & Publish
      {/if}
    </Button>

    <!-- Result -->
    {#if composer.result}
      <Alert variant={composer.result.success ? 'default' : 'destructive'} class="text-xs">
        {#if composer.result.success}
          <AlertTitle>Published</AlertTitle>
          <AlertDescription>
            <span aria-hidden="true">✓</span> Event ID: <span class="font-mono">{composer.result.eventId}</span>
            <span class="text-muted-foreground ml-2">({Math.round(composer.result.latencyMs)}ms)</span>
          </AlertDescription>
        {:else}
          <AlertTitle>Publish failed</AlertTitle>
          <AlertDescription><span aria-hidden="true">✕</span> {composer.result.error}</AlertDescription>
        {/if}
      </Alert>
    {/if}
  </div>
</Card.Content></Card.Root>
