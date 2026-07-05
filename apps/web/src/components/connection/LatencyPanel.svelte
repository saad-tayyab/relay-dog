<script lang="ts">
import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
import CheckIcon from "@lucide/svelte/icons/check";
import XIcon from "@lucide/svelte/icons/x";
import type { LatencyMetrics } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";

let {
	metrics,
	measuring,
	onMeasure,
}: {
	metrics: LatencyMetrics;
	measuring: boolean;
	onMeasure?: () => void;
} = $props();

interface LatencyRating {
	color: string;
	icon: "good" | "warn" | "bad" | "none";
	label: string;
}

function latencyRating(ms: number | null): LatencyRating {
	if (ms === null) return { color: "text-muted-foreground", icon: "none", label: "Not measured" };
	if (ms < 100) return { color: "text-success", icon: "good", label: "Fast" };
	if (ms < 500) return { color: "text-warning", icon: "warn", label: "Moderate" };
	return { color: "text-error", icon: "bad", label: "Slow" };
}

function formatMs(ms: number | null): string {
	if (ms === null) return "—";
	return `${ms}ms`;
}
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-foreground">Latency & Performance</h3>
    {#if onMeasure}
      <Button
        variant="outline"
        size="sm"
        onclick={onMeasure}
        disabled={measuring}
        class="bg-muted text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-40 transition-all"
      >
        {#if measuring}
          <span class="animate-pulse" role="status">Measuring…</span>
        {:else}
          Measure
        {/if}
      </Button>
    {/if}
  </div>

  <dl class="grid grid-cols-3 gap-3">
    <!-- WebSocket Latency -->
    <div class="text-center p-3 rounded-lg bg-muted border border-border">
      <dt class="text-xs uppercase tracking-wider text-muted-foreground mb-1">WS Round-Trip</dt>
      <dd class="text-lg font-mono font-bold {latencyRating(metrics.wsRoundTripMs).color}">
        <span class="inline-flex items-center gap-1">
          {#if latencyRating(metrics.wsRoundTripMs).icon === 'good'}<CheckIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.wsRoundTripMs).icon === 'warn'}<AlertTriangleIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.wsRoundTripMs).icon === 'bad'}<XIcon class="size-4" aria-hidden="true" />{/if}
          {formatMs(metrics.wsRoundTripMs)}
        </span>
      </dd>
      <dd class="text-[10px] text-muted-foreground mt-0.5">{latencyRating(metrics.wsRoundTripMs).label}</dd>
    </div>

    <!-- HTTP Latency -->
    <div class="text-center p-3 rounded-lg bg-muted border border-border">
      <dt class="text-xs uppercase tracking-wider text-muted-foreground mb-1">HTTP (NIP-11)</dt>
      <dd class="text-lg font-mono font-bold {latencyRating(metrics.httpLatencyMs).color}">
        <span class="inline-flex items-center gap-1">
          {#if latencyRating(metrics.httpLatencyMs).icon === 'good'}<CheckIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.httpLatencyMs).icon === 'warn'}<AlertTriangleIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.httpLatencyMs).icon === 'bad'}<XIcon class="size-4" aria-hidden="true" />{/if}
          {formatMs(metrics.httpLatencyMs)}
        </span>
      </dd>
      <dd class="text-[10px] text-muted-foreground mt-0.5">{latencyRating(metrics.httpLatencyMs).label}</dd>
    </div>

    <!-- EOSE Timing -->
    <div class="text-center p-3 rounded-lg bg-muted border border-border">
      <dt class="text-xs uppercase tracking-wider text-muted-foreground mb-1">EOSE</dt>
      <dd class="text-lg font-mono font-bold {latencyRating(metrics.eoseTimeMs).color}">
        <span class="inline-flex items-center gap-1">
          {#if latencyRating(metrics.eoseTimeMs).icon === 'good'}<CheckIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.eoseTimeMs).icon === 'warn'}<AlertTriangleIcon class="size-4" aria-hidden="true" />{:else if latencyRating(metrics.eoseTimeMs).icon === 'bad'}<XIcon class="size-4" aria-hidden="true" />{/if}
          {formatMs(metrics.eoseTimeMs)}
        </span>
      </dd>
      <dd class="text-[10px] text-muted-foreground mt-0.5">{latencyRating(metrics.eoseTimeMs).label}</dd>
    </div>
  </dl>

  {#if metrics.eoseEventCount > 0}
    <p class="mt-2 text-xs text-muted-foreground text-center">
      Loaded {metrics.eoseEventCount.toLocaleString()} historical events in {formatMs(metrics.eoseTimeMs)}
    </p>
  {/if}
</Card.Content></Card.Root>
