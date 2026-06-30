<script lang="ts">
import type { relaySocket } from '../../lib/stores/relaySocket.svelte';
import type { ConnectionStatus, RelayInfo } from '../../utils/relay';

// Components
import AuthStatusBadge from '../AuthStatusBadge.svelte';
import ConnectionPanel from '../ConnectionPanel.svelte';
import ConnectionStatusPanel from '../ConnectionStatusPanel.svelte';
import ErrorMessage from '../ErrorMessage.svelte';
import EventFeed from '../EventFeed.svelte';
import FeeDisplay from '../FeeDisplay.svelte';
import FilterBuilder from '../FilterBuilder.svelte';
import LatencyPanel from '../LatencyPanel.svelte';
import LimitationsPanel from '../LimitationsPanel.svelte';
import LoadingSpinner from '../LoadingSpinner.svelte';
import NipBadgeGrid from '../NipBadgeGrid.svelte';
import RelayProfile from '../RelayProfile.svelte';
import WriteTestPanel from '../WriteTestPanel.svelte';

type SocketStore = ReturnType<typeof relaySocket>;

let {
  url,
  relayInfo,
  connectionStatus,
  loading,
  error,
  socket,
  latency,
  writeTest,
  dbRelayId,
  onRetry,
}: {
  url: string;
  relayInfo: RelayInfo | null;
  connectionStatus: ConnectionStatus | null;
  loading: boolean;
  error: string | null;
  socket: SocketStore;
  latency: {
    metrics: {
      wsRoundTripMs: number | null;
      httpLatencyMs: number | null;
      eoseTimeMs: number | null;
      eoseEventCount: number;
    };
    measuring: boolean;
    measureAll: (url: string) => void;
  };
  writeTest: {
    status: 'idle' | 'testing' | 'success' | 'failed';
    latencyMs: number | null;
    error: string | null;
    eventId: string | null;
    runTest: (url: string) => void;
    reset: () => void;
  };
  dbRelayId: string | null;
  onRetry: () => void;
} = $props();

let showStream = $state(false);
</script>

<div class="space-y-5">
  <!-- Toggle between NIP-11 and Stream -->
  <div class="flex gap-2 mb-4">
    <button
      type="button"
      onclick={() => (showStream = false)}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {!showStream
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      NIP-11 Info
    </button>
    <button
      type="button"
      onclick={() => (showStream = true)}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {showStream
        ? 'bg-dark-card border border-dark-border text-text-primary'
        : 'text-text-muted hover:text-text-secondary'}"
    >
      Live Stream
      {#if socket.events.length > 0}
        <span class="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
          {socket.events.length.toLocaleString()}
        </span>
      {/if}
    </button>
  </div>

  {#if !showStream}
    <!-- NIP-11 Info View -->
    {#if loading}
      <LoadingSpinner />
    {/if}

    {#if !loading && error && !relayInfo}
      <ErrorMessage message={error} {onRetry} />
    {/if}

    {#if !loading && relayInfo}
      <div class="space-y-5">
        <RelayProfile relayId={dbRelayId ?? undefined} relay={{ url }} info={relayInfo} />
        <NipBadgeGrid nips={relayInfo.supported_nips || []} />
        <LimitationsPanel limitation={relayInfo.limitation} />
        <ConnectionStatusPanel status={connectionStatus} />

        <!-- Latency & Performance -->
        <LatencyPanel
          metrics={latency.metrics}
          measuring={latency.measuring}
          onMeasure={() => latency.measureAll(url)}
        />

        <!-- Write Test -->
        <WriteTestPanel
          status={writeTest.status}
          latencyMs={writeTest.latencyMs}
          error={writeTest.error}
          eventId={writeTest.eventId}
          onRunTest={() => writeTest.runTest(url)}
        />

        <!-- Fee Display -->
        {#if relayInfo?.fees}
          <FeeDisplay fees={relayInfo.fees} />
        {/if}

        <!-- Raw JSON toggle -->
        <details class="group">
          <summary
            class="cursor-pointer text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 py-2"
          >
            <svg
              aria-hidden="true"
              class="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Raw NIP-11 JSON
          </summary>
          <pre
            class="mt-2 p-4 rounded-xl bg-dark-surface border border-dark-border text-xs text-text-secondary overflow-x-auto font-mono leading-relaxed">{JSON.stringify(
              relayInfo,
              null,
              2,
            )}</pre>
        </details>

        <!-- Error details if connection had issues -->
        {#if !loading && error && relayInfo}
          <div
            class="px-4 py-3 rounded-xl bg-warning-dim border border-warning/20 text-sm text-warning"
          >
            ⚠ {error}
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <!-- Live Stream View -->
    <div class="space-y-5">
      <!-- Auth Status -->
      {#if socket.status === 'connected' || socket.authStatus !== 'anonymous'}
        <AuthStatusBadge status={socket.authStatus} onAuthenticate={socket.authenticate} />
      {/if}
      {#if socket.authError}
        <div class="px-4 py-3 rounded-xl bg-error-dim border border-error/20 text-sm text-error">
          ⚠ {socket.authError}
        </div>
      {/if}
      <ConnectionPanel
        relayUrl={url}
        status={socket.status}
        eventCount={socket.events.length}
        eose={socket.eose}
        eoseHints={socket.eoseHints}
        error={socket.error}
        notices={socket.notices}
        onConnect={socket.connect}
        onDisconnect={socket.disconnect}
      />
      <FilterBuilder connected={socket.status === 'connected'} onSend={socket.send} />
      <EventFeed events={socket.events} />
    </div>
  {/if}
</div>
