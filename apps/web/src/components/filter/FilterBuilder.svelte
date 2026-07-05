<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { DateTimePicker } from "$lib/components/ui/date-time-picker";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";

let {
	connected,
	onSend,
}: {
	connected: boolean;
	onSend: (message: string) => void;
} = $props();

let kinds = $state("1");
let authors = $state("");
let limit = $state(50);
let since = $state<number | null>(null);
let until = $state<number | null>(null);
let subId = $state<string | null>(null);

function generateSubId(): string {
	return `rs-${Math.random().toString(36).slice(2, 10)}`;
}

function handleSubscribe() {
	const filter: Record<string, unknown> = {};

	// Parse kinds
	const kindList = kinds
		.split(",")
		.map((k) => Number.parseInt(k.trim(), 10))
		.filter((k) => !Number.isNaN(k));
	if (kindList.length > 0) filter.kinds = kindList;

	// Parse authors
	const authorList = authors
		.split(",")
		.map((a) => a.trim())
		.filter((a) => a.length > 0);
	if (authorList.length > 0) filter.authors = authorList;

	// Limit
	if (limit > 0) filter.limit = limit;

  // Time range
  if (since) {
    filter.since = since;
  }
  if (until) {
    filter.until = until;
  }

	const id = generateSubId();
	subId = id;

	const req = JSON.stringify(["REQ", id, filter]);
	onSend(req);
}

function handleUnsubscribe() {
	if (!subId) return;
	const close = JSON.stringify(["CLOSE", subId]);
	onSend(close);
	subId = null;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-foreground">Subscription Filter</h3>
    {#if subId}
      <Badge variant="outline" class="px-2 py-0.5 text-xs font-mono">
        {subId}
      </Badge>
    {/if}
  </div>

  <fieldset class="grid grid-cols-2 gap-3 mb-4 border-0 p-0 m-0">
    <legend class="sr-only">Filter parameters</legend>

    <!-- Kinds -->
    <Field.Field>
      <Label for="filter-kinds" class="text-xs text-muted-foreground">Kinds</Label>
      <Input
        id="filter-kinds"
        type="text"
        bind:value={kinds}
        placeholder="0, 1, 4, 42"
        class="h-11 border-border bg-card px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
      />
    </Field.Field>

    <!-- Limit -->
    <Field.Field>
      <Label for="filter-limit" class="text-xs text-muted-foreground">Limit</Label>
      <Input
        id="filter-limit"
        type="number"
        bind:value={limit}
        min="1"
        max="500"
        class="h-11 border-border bg-card px-3 font-mono text-xs text-foreground"
      />
    </Field.Field>

    <!-- Since -->
    <Field.Field>
      <DateTimePicker
        bind:value={since}
        onChange={(ts) => { since = ts; }}
        label="Since"
      />
    </Field.Field>

    <!-- Until -->
    <Field.Field>
      <DateTimePicker
        bind:value={until}
        onChange={(ts) => { until = ts; }}
        label="Until"
      />
    </Field.Field>
  </fieldset>

  <!-- Authors (full width) -->
  <fieldset class="mb-4 border-0 p-0 m-0">
    <legend class="sr-only">Authors filter</legend>
    <Label for="filter-authors" class="mb-1 block text-xs text-muted-foreground">
      Authors (hex pubkeys, comma-separated)
    </Label>
    <Input
      id="filter-authors"
      type="text"
      bind:value={authors}
      placeholder="abc123..., def456..."
      class="h-11 border-border bg-card px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
    />
  </fieldset>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    {#if !subId}
      <Button
        type="button"
        variant="default"
        onclick={handleSubscribe}
        disabled={!connected}
        class="min-h-[44px] px-4 py-2 text-sm font-medium"
      >
        Subscribe
      </Button>
    {:else}
      <Button
        type="button"
        variant="destructive"
        onclick={handleUnsubscribe}
        class="min-h-[44px] px-4 py-2 text-sm font-medium"
      >
        Unsubscribe
      </Button>
    {/if}
    {#if !connected}
      <span class="text-xs text-muted-foreground">Connect to a relay first</span>
    {/if}
  </div>
</Card.Content></Card.Root>
