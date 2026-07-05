<script lang="ts">
import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { Spinner } from "$lib/components/ui/spinner";
import { apiFetch } from "../../utils/api";
import TooltipWrap from "../shared/TooltipWrap.svelte";

let { onAdded }: { onAdded?: () => void } = $props();

let showForm = $state(false);
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
			showForm = false;
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
	showForm = false;
	error = null;
	success = null;
}
</script>

<div class="space-y-3">
  <!-- Success message -->
  {#if success}
    <Alert role="status">
      <AlertTitle>Relay added</AlertTitle>
      <AlertDescription><span aria-hidden="true">✓</span> {success}</AlertDescription>
    </Alert>
  {/if}

  <!-- Toggle Button -->
  {#if !showForm}
    <Button
      type="button"
      variant="outline"
      onclick={() => (showForm = true)}
      class="w-full min-h-[44px] border-dashed text-sm text-muted-foreground"
    >
      <span aria-hidden="true">+</span> Add Relay
    </Button>
  {/if}

  <!-- Add Relay Form -->
  {#if showForm}
    <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-foreground">Add Relay</h3>
          <TooltipWrap label="Cancel">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onclick={cancel}
              aria-label="Cancel"
            >
              <span aria-hidden="true">✕</span>
            </Button>
          </TooltipWrap>
        </div>

        <!-- Error -->
        {#if error}
          <Alert variant="destructive">
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

        <!-- Submit -->
        <Button
          type="submit"
          variant="default"
          disabled={submitting || !url.trim()}
          class="w-full min-h-[44px] px-4 py-2.5 text-sm font-semibold"
        >
          {#if submitting}
            <Spinner class="size-4" />
            Adding…
          {:else}
            Add Relay
          {/if}
        </Button>
      </form>
    </Card.Content></Card.Root>
  {/if}
</div>
