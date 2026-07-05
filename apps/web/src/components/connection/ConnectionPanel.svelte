<script lang="ts">
import LinkIcon from "@lucide/svelte/icons/link";
import type { EoseResult } from "@relayscope/shared";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { StatusDot } from '$lib/components/ui/status-dot';
import type { EoseState } from "../../lib/stores/relaySocket.svelte";
import type { CheckStatus } from "../../utils/relay";
import AuthPrefixDisplay from "../auth/AuthPrefixDisplay.svelte";
import EoseIndicator from "./EoseIndicator.svelte";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

const STATUS_MAP: Record<ConnectionStatus, CheckStatus> = {
	disconnected: "pending",
	connecting: "checking",
	connected: "success",
	error: "error",
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
	disconnected: "Disconnected",
	connecting: "Connecting…",
	connected: "Connected",
	error: "Error",
};

let {
	relayUrl,
	status,
	eventCount,
	eose,
	eoseHints = null,
	error,
	notices,
	onConnect,
	onDisconnect,
}: {
	relayUrl: string;
	status: ConnectionStatus;
	eventCount: number;
	eose: EoseState;
	eoseHints?: EoseResult | null;
	error: string | null;
	notices: string[];
	onConnect: () => void;
	onDisconnect: () => void;
} = $props();
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <StatusDot status={STATUS_MAP[status]} />
        <span class="text-sm font-semibold text-foreground">{STATUS_LABEL[status]}</span>
      </div>
      {#if status === 'disconnected' || status === 'error'}
        <Button
          variant="default"
          onclick={onConnect}
          disabled={!relayUrl}
          class="bg-success-dim border border-success/20 text-success hover:bg-success/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Connect
        </Button>
      {:else}
        <Button
          variant="destructive"
          onclick={onDisconnect}
          class="bg-error-dim border border-error/20 text-error hover:bg-error/25 transition-all"
        >
          Disconnect
        </Button>
      {/if}
    </div>

    <!-- Relay URL -->
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <LinkIcon class="size-3.5 shrink-0" aria-hidden="true" />
      <span class="font-mono truncate" title={relayUrl}>{relayUrl || 'No relay URL'}</span>
    </div>

    <!-- Stats row -->
    <div class="flex items-center gap-4 text-xs text-muted-foreground">
      <span>
        Events: <span class="font-mono text-foreground">{eventCount.toLocaleString()}</span>
      </span>
      {#if eose.received}
        <span>
          Historical:
          <span class="font-mono text-foreground">{eose.historicalCount.toLocaleString()}</span>
        </span>
        <span>
          Live: <span class="font-mono text-foreground">{eose.liveCount.toLocaleString()}</span>
        </span>
      {/if}
    </div>

    <!-- EOSE banner with NIP-67 hints -->
    {#if eose.received && eose.historicalCount > 0}
      <EoseIndicator eoseResult={eoseHints} />
      {#if !eoseHints}
        <div role="status" class="px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success">
          <span aria-hidden="true">✓</span> Loaded {eose.historicalCount.toLocaleString()} historical events
        </div>
      {/if}
    {/if}

    <!-- Error display -->
    {#if error}
      <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
        <span aria-hidden="true">✕</span> {error}
      </div>
    {/if}

    <!-- Notices -->
    {#if notices.length > 0}
      <div role="status" aria-live="polite" class="flex flex-col gap-1.5">
        {#each notices as notice, i (`notice-${i}`)}
          <div
            class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-xs"
          >
            <AuthPrefixDisplay message={notice} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card.Content></Card.Root>
