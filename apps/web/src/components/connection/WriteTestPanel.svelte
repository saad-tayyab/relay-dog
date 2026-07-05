<script lang="ts">
import type { WriteTestStatus } from "@relayscope/shared";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";

let {
	status,
	latencyMs,
	error,
	eventId,
	onRunTest,
}: {
	status: WriteTestStatus;
	latencyMs: number | null;
	error: string | null;
	eventId: string | null;
	onRunTest?: () => void;
} = $props();

const statusDisplay = $derived.by(() => {
	switch (status) {
		case "success":
			return {
				label: "Write OK",
				color: "text-success",
				bg: "bg-success-dim",
				border: "border-success/20",
			};
		case "failed":
			return {
				label: "Write Failed",
				color: "text-error",
				bg: "bg-error-dim",
				border: "border-error/20",
			};
		case "testing":
			return {
				label: "Testing…",
				color: "text-primary",
				bg: "bg-primary/15",
				border: "border-primary/30",
			};
		default:
			return {
				label: "Not tested",
				color: "text-muted-foreground",
				bg: "bg-muted",
				border: "border-border",
			};
	}
});
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-foreground">Write Test</h3>
    {#if onRunTest}
      <Button
        variant="outline"
        onclick={onRunTest}
        disabled={status === 'testing'}
        class="bg-muted text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-40 transition-all"
      >
        {status === 'testing' ? 'Testing…' : 'Run Test'}
      </Button>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    <Badge variant="outline" class="{statusDisplay.color} {statusDisplay.bg} {statusDisplay.border}">
      {statusDisplay.label}
    </Badge>

    {#if latencyMs !== null}
      <span class="text-xs text-muted-foreground">
        Latency: <span class="font-mono text-muted-foreground">{latencyMs}ms</span>
      </span>
    {/if}

    {#if eventId}
      <span class="text-xs text-muted-foreground font-mono truncate max-w-[180px]" title={eventId}>
        id: {eventId.slice(0, 12)}…
      </span>
    {/if}
  </div>

  {#if error}
    <p role="alert" class="mt-2 text-xs text-error">{error}</p>
  {/if}
</Card.Content></Card.Root>
