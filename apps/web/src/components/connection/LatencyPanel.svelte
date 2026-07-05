<script lang="ts">
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

function latencyColor(ms: number | null): string {
	if (ms === null) return "text-muted-foreground";
	if (ms < 100) return "text-success";
	if (ms < 500) return "text-warning";
	return "text-error";
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
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.wsRoundTripMs)}">
        {formatMs(metrics.wsRoundTripMs)}
      </dd>
    </div>

    <!-- HTTP Latency -->
    <div class="text-center p-3 rounded-lg bg-muted border border-border">
      <dt class="text-xs uppercase tracking-wider text-muted-foreground mb-1">HTTP (NIP-11)</dt>
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.httpLatencyMs)}">
        {formatMs(metrics.httpLatencyMs)}
      </dd>
    </div>

    <!-- EOSE Timing -->
    <div class="text-center p-3 rounded-lg bg-muted border border-border">
      <dt class="text-xs uppercase tracking-wider text-muted-foreground mb-1">EOSE</dt>
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.eoseTimeMs)}">
        {formatMs(metrics.eoseTimeMs)}
      </dd>
    </div>
  </dl>

  {#if metrics.eoseEventCount > 0}
    <p class="mt-2 text-xs text-muted-foreground text-center">
      Loaded {metrics.eoseEventCount.toLocaleString()} historical events in {formatMs(metrics.eoseTimeMs)}
    </p>
  {/if}
</Card.Content></Card.Root>
