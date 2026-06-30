<script lang="ts">
import { relaySocket } from './lib/stores/relaySocket.svelte';
import type { ConnectionStatus, RelayInfo } from './utils/relay';
import { checkConnections, fetchNip11, normalizeUrl } from './utils/relay';
import './index.css';

// Components
import AuthStatusBadge from './components/AuthStatusBadge.svelte';
import ConnectionPanel from './components/ConnectionPanel.svelte';
import ConnectionStatusPanel from './components/ConnectionStatusPanel.svelte';
import ErrorMessage from './components/ErrorMessage.svelte';
import EventFeed from './components/EventFeed.svelte';
import FeeDisplay from './components/FeeDisplay.svelte';
import FilterBuilder from './components/FilterBuilder.svelte';
import LatencyPanel from './components/LatencyPanel.svelte';
import LimitationsPanel from './components/LimitationsPanel.svelte';
import LoadingSpinner from './components/LoadingSpinner.svelte';
import NipBadgeGrid from './components/NipBadgeGrid.svelte';
import RelayDirectory from './components/RelayDirectory.svelte';
import RelayProfile from './components/RelayProfile.svelte';
import EventVerifier from './components/verifier/EventVerifier.svelte';
import WriteTestPanel from './components/WriteTestPanel.svelte';

// Composables
import { useLatencyMeasurement } from './lib/composables/useLatencyMeasurement.svelte';
import { useWriteTest } from './lib/composables/useWriteTest.svelte';

type Tab = 'nip11' | 'stream' | 'verifier' | 'directory';

const POPULAR_RELAYS = [
  'relay.damus.io',
  'nos.lol',
  'relay.nostr.band',
  'relay.primal.net',
  'relay.nostr.info',
  'nostr.wine',
  'relay.snort.social',
];

// ─── State ───

let url = $state('');
let relayInfo = $state<RelayInfo | null>(null);
let connectionStatus = $state<ConnectionStatus | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let activeTab = $state<Tab>('nip11');

const normalizedUrl = $derived(normalizeUrl(url));

// WebSocket store — reactive to URL changes via getter
const socket = relaySocket(() => normalizedUrl);

// Composable instances
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const latency = useLatencyMeasurement();
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const writeTest = useWriteTest();

// ─── Derived State ───

const isNip11Tab = $derived(activeTab === 'nip11');
const isStreamTab = $derived(activeTab === 'stream');
const isVerifierTab = $derived(activeTab === 'verifier');
const isDirectoryTab = $derived(activeTab === 'directory');
const hasRelay = $derived(normalizedUrl.length > 0);

// ─── Actions ───

async function handleFetch(targetUrl?: string) {
  const inputUrl = targetUrl || url;
  const normalized = normalizeUrl(inputUrl);
  if (!normalized) return;

  loading = true;
  error = null;
  relayInfo = null;
  connectionStatus = null;
  latency.reset();
  writeTest.reset();

  try {
    const [infoResult, connResult] = await Promise.allSettled([
      fetchNip11(normalized),
      checkConnections(normalized),
    ]);

    // NIP-11 info
    if (infoResult.status === 'fulfilled') {
      relayInfo = infoResult.value;
    } else {
      error =
        infoResult.reason instanceof Error
          ? infoResult.reason.message
          : 'Failed to fetch NIP-11 info';
    }

    // Connection status (always available from allSettled)
    if (connResult.status === 'fulfilled') {
      connectionStatus = connResult.value;
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Unknown error occurred';
  } finally {
    loading = false;
  }
}

function handleSubmit(e: Event) {
  e.preventDefault();
  handleFetch();
}

function handleQuickPick(relay: string) {
  url = relay;
  handleFetch(relay);
}
</script>

<div class="min-h-screen bg-dark-bg">
  <!-- Header -->
  <header class="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
      <div
        class="w-9 h-9 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center"
      >
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <h1 class="text-lg font-bold text-text-primary leading-tight">Relay Dog</h1>
        <p class="text-xs text-text-muted">Nostr relay inspector</p>
      </div>
      <span
        class="ml-auto text-[10px] font-mono px-2 py-1 rounded-full bg-dark-surface border border-dark-border text-text-muted"
      >
        Phase 5
      </span>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <!-- URL Input -->
    <form onsubmit={handleSubmit} class="mb-8 animate-fade-in">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <svg
              aria-hidden="true"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            bind:value={url}
            placeholder="wss://relay.damus.io"
            class="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-card border border-dark-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-all font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          class="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {#if loading}
            <div
              class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
            ></div>
            Inspecting
          {:else}
            <svg
              aria-hidden="true"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Inspect
          {/if}
        </button>
      </div>

      <!-- Quick pick relays -->
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span class="text-xs text-text-muted mr-1 py-1">Try:</span>
        {#each POPULAR_RELAYS as relay (relay)}
          <button
            type="button"
            onclick={() => handleQuickPick(relay)}
            class="text-xs px-2.5 py-1 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
          >
            {relay}
          </button>
        {/each}
      </div>
    </form>

    <!-- Tab Toggle -->
    <div class="flex gap-1 p-1 mb-6 rounded-xl bg-dark-surface border border-dark-border">
      <button
        type="button"
        onclick={() => (activeTab = 'nip11')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {isNip11Tab
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        NIP-11 Info
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'stream')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {isStreamTab
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        Live Stream
        {#if socket.events.length > 0}
          <span
            class="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent"
          >
            {socket.events.length.toLocaleString()}
          </span>
        {/if}
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'verifier')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {isVerifierTab
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        🔐 Event Verifier
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'directory')}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all {isDirectoryTab
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        📂 Directory
      </button>
    </div>

    <!-- NIP-11 Tab -->
    {#if isNip11Tab}
      {#if loading}
        <LoadingSpinner />
      {/if}

      {#if !loading && error && !relayInfo}
        <ErrorMessage message={error} onRetry={() => handleFetch()} />
      {/if}

      {#if !loading && relayInfo}
        <div class="space-y-5">
          <RelayProfile info={relayInfo} />
          <NipBadgeGrid nips={relayInfo.supported_nips || []} />
          <LimitationsPanel limitation={relayInfo.limitation} />
          <ConnectionStatusPanel status={connectionStatus} />

          <!-- Latency & Performance -->
          <LatencyPanel
            metrics={latency.metrics}
            measuring={latency.measuring}
            onMeasure={() => latency.measureAll(normalizedUrl)}
          />

          <!-- Write Test -->
          <WriteTestPanel
            status={writeTest.status}
            latencyMs={writeTest.latencyMs}
            error={writeTest.error}
            eventId={writeTest.eventId}
            onRunTest={() => writeTest.runTest(normalizedUrl)}
          />

          <!-- Fee Display -->
          {#if relayInfo?.limitation}
            <FeeDisplay limitation={relayInfo.limitation} />
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

      {#if !loading && !error && !relayInfo}
        <div class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div
            class="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-6"
          >
            <svg
              aria-hidden="true"
              class="w-10 h-10 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-text-primary mb-2">
            Inspect a Nostr Relay
          </h2>
          <p class="text-text-muted text-sm max-w-sm mb-6">
            Enter a relay URL above to fetch its NIP-11 info document, check connection status, and
            explore supported features.
          </p>
          <div class="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              NIP-11 Info
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              Connection Checks
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              NIP Badge Grid
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              NIP-42 Auth
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              Latency Metrics
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              Write Test
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
              Relay Directory
            </span>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Live Stream Tab -->
    {#if isStreamTab}
      <div class="space-y-5 animate-fade-in">
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
          relayUrl={normalizedUrl}
          status={socket.status}
          eventCount={socket.events.length}
          eose={socket.eose}
          error={socket.error}
          notices={socket.notices}
          onConnect={socket.connect}
          onDisconnect={socket.disconnect}
        />
        <FilterBuilder connected={socket.status === 'connected'} onSend={socket.send} />
        <EventFeed events={socket.events} />
      </div>
    {/if}

    <!-- Event Verifier Tab -->
    {#if isVerifierTab}
      <EventVerifier />
    {/if}

    <!-- Directory Tab -->
    {#if isDirectoryTab}
      <RelayDirectory
        onSelectRelay={(relayUrl) => {
          url = relayUrl;
          activeTab = 'nip11';
          handleFetch(relayUrl);
        }}
      />
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t border-dark-border mt-auto">
    <div
      class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-text-muted"
    >
      <span>Relay Dog · Nostr Relay Inspector</span>
      <span class="font-mono">v0.1.0</span>
    </div>
  </footer>
</div>
