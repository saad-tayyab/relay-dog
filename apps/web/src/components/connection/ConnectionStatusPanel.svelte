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

import * as Card from "$lib/components/ui/card";
import { StatusDot } from '$lib/components/ui/status-dot';

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
  <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md animate-fade-in"><Card.Content class="p-5 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground mb-4">
      Connection Status
      {#if status.latencyMs !== undefined}
        <span class="ml-2 text-xs font-normal normal-case tracking-normal text-muted-foreground">
          · {status.latencyMs}ms latency
        </span>
      {/if}
    </h3>
    <ul class="space-y-2">
      {#each checks as { label, key, detail } (key)}
        <li
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted border border-border"
        >
          <StatusDot status={status[key]} />
          <span class="text-sm text-muted-foreground flex-1">{label}</span>
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
  </Card.Content></Card.Root>
{/if}
