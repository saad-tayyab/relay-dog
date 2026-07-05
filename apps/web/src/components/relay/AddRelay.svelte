<script lang="ts">
import PlusIcon from "@lucide/svelte/icons/plus";
import XIcon from "@lucide/svelte/icons/x";
import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
import { Button } from "$lib/components/ui/button";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Sheet from "$lib/components/ui/sheet";
import { Spinner } from "$lib/components/ui/spinner";
import { apiFetch } from "../../utils/api";

let { onAdded }: { onAdded?: () => void } = $props();

let showSheet = $state(false);
let url = $state("");
let name = $state("");
let apiKey = $state("");
let submitting = $state(false);
let error = $state<string | null>(null);
let success = $state<string | null>(null);

// Load saved API key from localStorage
$effect(() => {
	const saved = localStorage.getItem("relayscope_api_key");
	if (saved) apiKey = saved;
});

async function handleSubmit() {
	if (!url.trim() || submitting) return;

	submitting = true;
	error = null;
	success = null;

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (apiKey.trim()) {
			headers.Authorization = `Bearer ${apiKey.trim()}`;
			// Save for future use
			localStorage.setItem("relayscope_api_key", apiKey.trim());
		}

		const res = await apiFetch("/api/relays", {
			method: "POST",
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
			url = "";
			name = "";
			showSheet = false;
			onAdded?.();
		} else if (res.status === 409) {
			error = "This relay is already in the directory";
		} else if (res.status === 401) {
			error = "Unauthorized — check your API key";
		} else {
			error = json.error || "Failed to add relay";
		}
	} catch (e: unknown) {
		error = e instanceof Error ? e.message : "Failed to add relay";
	} finally {
		submitting = false;
	}
}

function cancel() {
	showSheet = false;
	error = null;
	success = null;
}
</script>

<div class="flex flex-col gap-3">
  <!-- Success message -->
  {#if success}
    <Alert role="status">
      <AlertTitle>Relay added</AlertTitle>
      <AlertDescription><span aria-hidden="true">✓</span> {success}</AlertDescription>
    </Alert>
  {/if}

  <!-- Toggle Button -->
  <Button
    type="button"
    variant="outline"
    onclick={() => (showSheet = true)}
    class="w-full min-h-[44px] border-dashed text-sm text-muted-foreground"
  >
    <PlusIcon class="size-4" aria-hidden="true" /> Add Relay
  </Button>

  <!-- Add Relay Sheet -->
  <Sheet.Root bind:open={showSheet}>
    <Sheet.Content side="right" class="w-full sm:max-w-md">
      <Sheet.Header>
        <Sheet.Title>Add Relay</Sheet.Title>
        <Sheet.Description>Add a new relay to the directory</Sheet.Description>
      </Sheet.Header>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-4 mt-4">
        <!-- Error -->
        {#if error}
          <Alert variant="destructive" role="alert">
            <AlertTitle>Add relay failed</AlertTitle>
            <AlertDescription><span aria-hidden="true">⚠</span> {error}</AlertDescription>
          </Alert>
        {/if}

        <!-- URL -->
        <Field.Field>
          <Label for="add-relay-url" class="mb-1 block text-xs text-muted-foreground">
            Relay URL <span class="text-error">*</span>
          </Label>
          <Input
            id="add-relay-url"
            type="text"
            bind:value={url}
            placeholder="wss://relay.example.com"
            required
            class="h-11 border-border bg-card px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
          />
        </Field.Field>

        <!-- Name -->
        <Field.Field>
          <Label for="add-relay-name" class="mb-1 block text-xs text-muted-foreground">
            Name <span class="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="add-relay-name"
            type="text"
            bind:value={name}
            placeholder="My Relay"
            class="h-11 border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </Field.Field>

        <!-- API Key -->
        <Field.Field>
          <Label for="add-relay-apikey" class="mb-1 block text-xs text-muted-foreground">
            API Key <span class="text-muted-foreground">(saved locally)</span>
          </Label>
          <Input
            id="add-relay-apikey"
            type="password"
            bind:value={apiKey}
            placeholder="Required for production"
            class="h-11 border-border bg-card px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
          />
        </Field.Field>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onclick={cancel}
            class="flex-1 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={submitting || !url.trim()}
            class="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold"
          >
            {#if submitting}
              <Spinner class="size-4" />
              Adding…
            {:else}
              Add Relay
            {/if}
          </Button>
        </div>
      </form>
    </Sheet.Content>
  </Sheet.Root>
</div>
