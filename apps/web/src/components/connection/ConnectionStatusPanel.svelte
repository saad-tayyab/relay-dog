<script lang="ts">
type CheckStatus = "success" | "error" | "checking" | "pending";

interface ConnectionStatus {
	http: CheckStatus;
	cors: CheckStatus;
	websocket: CheckStatus;
	httpDetail?: string;
	corsDetail?: string;
	wsDetail?: string;
	latencyMs?: number;
}

import { SectionCard, StatusDot } from "@relayscope/ui";

let { status }: { status: ConnectionStatus | null } = $props();

const checks = $derived(
	status
		? [
				{
					label: "HTTP Reachable",
					key: "http" as const,
					detail: status.httpDetail,
				},
				{
					label: "CORS Configured",
					key: "cors" as const,
					detail: status.corsDetail,
				},
				{
					label: "WebSocket Connectable",
					key: "websocket" as const,
					detail: status.wsDetail,
				},
			]
		: [],
);
</script>

{#if status}
  <SectionCard className="animate-fade-in">
    <h3 class="text-sm font-semibold text-text-primary mb-4">
      Connection Status
      {#if status.latencyMs !== undefined}
        <span class="ml-2 text-xs font-normal normal-case tracking-normal text-text-secondary">
          · {status.latencyMs}ms latency
        </span>
      {/if}
    </h3>
    <ul class="space-y-2">
      {#each checks as { label, key, detail } (key)}
        <li
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-dark-surface border border-dark-border"
        >
          <StatusDot status={status[key]} />
          <span class="text-sm text-text-secondary flex-1">{label}</span>
          {#if status[key] === 'checking'}
            <span class="text-xs text-warning">Checking…</span>
          {/if}
          {#if detail && status[key] !== 'checking'}
            <span
              class="text-xs font-medium {status[key] === 'success' ? 'text-success' : 'text-error'}"
            >
              {detail}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </SectionCard>
{/if}
