<script lang="ts">
import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { Textarea } from "$lib/components/ui/textarea";
import { useEventDeleter } from "../../lib/composables/useEventDeleter.svelte";

let { targetRelay }: { targetRelay: string } = $props();

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const deleter = useEventDeleter();

// Set initial relay from prop (runs once on mount)
let relayInitialized = $state(false);
$effect(() => {
	if (targetRelay && !relayInitialized) {
		deleter.setTargetRelay(targetRelay);
		relayInitialized = true;
	}
});

let inputIds = $state("");

function handleAddIds() {
	const ids = inputIds
		.split(/[,\n]/)
		.map((id) => id.trim())
		.filter((id) => id.length > 0);

	for (const id of ids) {
		deleter.addEventId(id);
	}
	inputIds = "";
}

let confirmDelete = $state(false);

function handleRelayInput(e: Event) {
	deleter.setTargetRelay((e.target as HTMLInputElement).value);
}

async function handleDelete() {
	if (!confirmDelete) {
		confirmDelete = true;
		return;
	}
	await deleter.deleteEvents();
	confirmDelete = false;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Deleter</h3>
      <Badge variant="outline" class="text-xs text-muted-foreground">NIP-09</Badge>
    </div>

    <!-- Manual Input -->
    <Field.Field>
      <Label for="event-ids" class="mb-1 block text-xs text-muted-foreground">
        Event IDs (comma or newline separated)
      </Label>
      <Textarea
        id="event-ids"
        bind:value={inputIds}
        rows={3}
        placeholder="abc123..., def456..."
        class="border-border bg-card px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={handleAddIds}
        disabled={!inputIds.trim()}
        class="mt-2 min-h-[44px] text-xs"
      >
        Add IDs
      </Button>
    </Field.Field>

    <!-- Event ID List -->
    {#if deleter.eventIds.length > 0}
      <div class="space-y-1">
        <p class="text-xs text-text-muted">
          {deleter.eventIds.length} event{deleter.eventIds.length !== 1 ? 's' : ''} to delete
        </p>
        <div class="max-h-32 overflow-y-auto space-y-1">
          {#each deleter.eventIds as id (id)}
            <div class="flex items-center justify-between px-2 py-1 rounded bg-dark-surface/50 text-xs">
              <span class="font-mono text-text-secondary truncate">{id}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove event ID"
                onclick={() => deleter.removeEventId(id)}
                class="ml-2 text-muted-foreground hover:text-destructive"
              >
                <span aria-hidden="true">✕</span>
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Reason -->
    <Field.Field>
      <Label for="delete-reason" class="mb-1 block text-xs text-muted-foreground">
        Reason (optional)
      </Label>
      <Input
        id="delete-reason"
        type="text"
        bind:value={deleter.reason}
        placeholder="Why are you deleting these events?"
        class="h-11 border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </Field.Field>

    <!-- Target Relay -->
    <Field.Field>
      <Label for="delete-relay" class="mb-1 block text-xs text-muted-foreground">Target Relay</Label>
      <Input
        id="delete-relay"
        type="text"
        value={deleter.targetRelay}
        oninput={handleRelayInput}
        placeholder="wss://relay.example.com"
        class="h-11 border-border bg-card px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />
    </Field.Field>

    <!-- Warning -->
    <Alert>
      <AlertTitle>Deletion notice</AlertTitle>
      <AlertDescription><span aria-hidden="true">⚠</span> Deletion is a request — relays may not honor it.</AlertDescription>
    </Alert>

    <!-- Confirmation Banner -->
    {#if confirmDelete}
      <Alert variant="destructive" class="text-xs">
        <AlertTitle>Confirm deletion</AlertTitle>
        <AlertDescription class="mb-2">
          Confirm deletion of {deleter.eventIds.length} event{deleter.eventIds.length !== 1 ? 's' : ''} from {deleter.targetRelay || 'relay'}?
        </AlertDescription>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            onclick={handleDelete}
            disabled={deleter.deleting}
            class="min-h-[44px] px-4 py-2.5 text-xs font-semibold"
          >
            {deleter.deleting ? 'Deleting...' : 'Yes, delete'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onclick={() => (confirmDelete = false)}
            class="min-h-[44px] px-4 py-2.5 text-xs"
          >
            Cancel
          </Button>
        </div>
      </Alert>
    {:else}
      <!-- Delete Button -->
      <Button
        type="button"
        variant="destructive"
        aria-label={`Delete ${deleter.eventIds.length} events`}
        onclick={handleDelete}
        disabled={deleter.deleting || deleter.eventIds.length === 0 || !deleter.targetRelay}
        class="w-full min-h-[44px] px-4 py-3 text-sm font-semibold"
      >
        Delete {deleter.eventIds.length} Event{deleter.eventIds.length !== 1 ? 's' : ''}
      </Button>
    {/if}

    <!-- Results -->
    {#if deleter.results.length > 0}
      <div role="status" aria-live="polite" class="space-y-1">
        <p class="text-xs text-text-muted">Results</p>
        {#each deleter.results as r (r.eventId)}
          <div
            class="px-2 py-1.5 rounded text-xs {r.success
              ? 'bg-success-dim border border-success/20 text-success'
              : 'bg-error-dim border border-error/20 text-error'}"
          >
            <span class="font-mono">{r.eventId.slice(0, 12)}...</span>
            {#if r.success}
              <span aria-hidden="true">✓</span> Deleted
            {:else}
              <span aria-hidden="true">✕</span> {r.error}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card.Content></Card.Root>
