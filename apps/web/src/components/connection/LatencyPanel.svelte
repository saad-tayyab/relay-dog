<script lang="ts">
import type { LatencyMetrics } from "@relayscope/shared";
import { SectionCard } from "@relayscope/ui";

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
	if (ms === null) return "text-text-muted";
	if (ms < 100) return "text-success";
	if (ms < 500) return "text-warning";
	return "text-error";
}

function formatMs(ms: number | null): string {
	if (ms === null) return "—";
	return `${ms}ms`;
}
</script>

<SectionCard>
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-text-primary">Latency & Performance</h3>
    {#if onMeasure}
      <button
        type="button"
        onclick={onMeasure}
        disabled={measuring}
        class="min-h-[44px] text-xs px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary hover:border-accent-border disabled:opacity-40 transition-all"
      >
        {#if measuring}
          <span class="animate-pulse">Measuring…</span>
        {:else}
          Measure
        {/if}
      </button>
    {/if}
  </div>

  <dl class="grid grid-cols-3 gap-3">
    <!-- WebSocket Latency -->
    <div class="text-center p-3 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs uppercase tracking-wider text-text-muted mb-1">WS Round-Trip</dt>
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.wsRoundTripMs)}">
        {formatMs(metrics.wsRoundTripMs)}
      </dd>
    </div>

    <!-- HTTP Latency -->
    <div class="text-center p-3 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs uppercase tracking-wider text-text-muted mb-1">HTTP (NIP-11)</dt>
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.httpLatencyMs)}">
        {formatMs(metrics.httpLatencyMs)}
      </dd>
    </div>

    <!-- EOSE Timing -->
    <div class="text-center p-3 rounded-lg bg-dark-surface border border-dark-border">
      <dt class="text-xs uppercase tracking-wider text-text-muted mb-1">EOSE</dt>
      <dd class="text-lg font-mono font-bold {latencyColor(metrics.eoseTimeMs)}">
        {formatMs(metrics.eoseTimeMs)}
      </dd>
    </div>
  </dl>

  {#if metrics.eoseEventCount > 0}
    <p class="mt-2 text-xs text-text-muted text-center">
      Loaded {metrics.eoseEventCount.toLocaleString()} historical events in {formatMs(metrics.eoseTimeMs)}
    </p>
  {/if}
</SectionCard>
