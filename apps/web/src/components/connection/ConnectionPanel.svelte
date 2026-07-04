<script lang="ts">
import type { EoseResult } from "@relayscope/shared";
import { SectionCard, StatusDot } from "@relayscope/ui";
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

<SectionCard>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <StatusDot status={STATUS_MAP[status]} />
        <span class="text-sm font-semibold text-text-primary">{STATUS_LABEL[status]}</span>
      </div>
      {#if status === 'disconnected' || status === 'error'}
        <button
          type="button"
          onclick={onConnect}
          disabled={!relayUrl}
          class="min-h-[44px] px-4 py-2.5 rounded-lg bg-success-dim border border-success/20 text-success text-sm font-medium hover:bg-success/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Connect
        </button>
      {:else}
        <button
          type="button"
          onclick={onDisconnect}
          class="min-h-[44px] px-4 py-2.5 rounded-lg bg-error-dim border border-error/20 text-error text-sm font-medium hover:bg-error/25 transition-all"
        >
          Disconnect
        </button>
      {/if}
    </div>

    <!-- Relay URL -->
    <div class="flex items-center gap-2 text-xs text-text-muted">
      <svg
        aria-hidden="true"
        class="w-3.5 h-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
        />
      </svg>
      <span class="font-mono truncate" title={relayUrl}>{relayUrl || 'No relay URL'}</span>
    </div>

    <!-- Stats row -->
    <div class="flex items-center gap-4 text-xs text-text-secondary">
      <span>
        Events: <span class="font-mono text-text-primary">{eventCount.toLocaleString()}</span>
      </span>
      {#if eose.received}
        <span>
          Historical:
          <span class="font-mono text-text-primary">{eose.historicalCount.toLocaleString()}</span>
        </span>
        <span>
          Live: <span class="font-mono text-text-primary">{eose.liveCount.toLocaleString()}</span>
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
      <div role="status" aria-live="polite" class="space-y-1.5">
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
</SectionCard>
