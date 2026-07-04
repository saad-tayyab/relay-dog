<script lang="ts">
import type { WriteTestStatus } from "@relayscope/shared";
import { SectionCard } from "@relayscope/ui";

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
				color: "text-accent",
				bg: "bg-accent-dim",
				border: "border-accent-border",
			};
		default:
			return {
				label: "Not tested",
				color: "text-text-muted",
				bg: "bg-dark-surface",
				border: "border-dark-border",
			};
	}
});
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-text-primary">Write Test</h3>
    {#if onRunTest}
      <button
        type="button"
        onclick={onRunTest}
        disabled={status === 'testing'}
        class="text-xs px-3 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary hover:border-accent-border disabled:opacity-40 transition-all"
      >
        {status === 'testing' ? 'Testing…' : 'Run Test'}
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border {statusDisplay.color} {statusDisplay.bg} {statusDisplay.border}"
    >
      {statusDisplay.label}
    </span>

    {#if latencyMs !== null}
      <span class="text-xs text-text-muted">
        Latency: <span class="font-mono text-text-secondary">{latencyMs}ms</span>
      </span>
    {/if}

    {#if eventId}
      <span class="text-xs text-text-muted font-mono truncate max-w-[180px]" title={eventId}>
        id: {eventId.slice(0, 12)}…
      </span>
    {/if}
  </div>

  {#if error}
    <p class="mt-2 text-xs text-error">{error}</p>
  {/if}
</SectionCard>
