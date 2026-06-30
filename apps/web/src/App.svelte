<script lang="ts">
import { relaySocket } from './lib/stores/relaySocket.svelte';
import type { ConnectionStatus, RelayInfo } from './utils/relay';
import { checkConnections, fetchNip11, normalizeUrl } from './utils/relay';
import { getHashSection, type Section, setHashSection } from './utils/router';
import './index.css';

// Components
import InspectorSection from './components/inspector/InspectorSection.svelte';
import MobileNav from './components/nav/MobileNav.svelte';
import NavBar from './components/nav/NavBar.svelte';
import PublisherSection from './components/publisher/PublisherSection.svelte';
import RelayDirectory from './components/RelayDirectory.svelte';
import ToolsSection from './components/tools/ToolsSection.svelte';
import EventVerifier from './components/verifier/EventVerifier.svelte';

// Composables
import { useLatencyMeasurement } from './lib/composables/useLatencyMeasurement.svelte';
import { useWriteTest } from './lib/composables/useWriteTest.svelte';

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
let activeSection = $state<Section>(getHashSection());
let dbRelayId = $state<string | null>(null);
let prefilledEvent = $state<unknown>(null);

const normalizedUrl = $derived(normalizeUrl(url));

// WebSocket store — reactive to URL changes via getter
const socket = relaySocket(() => normalizedUrl);

// Composable instances
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const latency = useLatencyMeasurement();
// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable, not a React hook
const writeTest = useWriteTest();

// ─── Navigation ───

function handleNavigate(section: Section) {
  activeSection = section;
  setHashSection(section);
}

// Listen for hash changes (back/forward)
$effect(() => {
  function onHashChange() {
    activeSection = getHashSection();
  }
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
});

function handleEditAndRepublish(event: unknown) {
  prefilledEvent = event;
  activeSection = 'publisher';
  setHashSection('publisher');
}

// ─── Actions ───

async function handleFetch(targetUrl?: string) {
  const inputUrl = targetUrl || url;
  const normalized = normalizeUrl(inputUrl);
  if (!normalized) return;

  loading = true;
  error = null;
  relayInfo = null;
  connectionStatus = null;
  dbRelayId = null;
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

    // Look up DB relay ID for Phase 7 data
    dbRelayId = null;
    try {
      const lookupRes = await fetch(`/api/relays/lookup?url=${encodeURIComponent(normalized)}`);
      const lookupJson = await lookupRes.json();
      if (lookupJson.success && lookupJson.data) {
        dbRelayId = lookupJson.data.id;
      }
    } catch {
      // Not in DB — that's fine, Phase 7 panels won't show
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
        aria-hidden="true"
        class="ml-auto text-xs font-mono px-2 py-1 rounded-full bg-dark-surface border border-dark-border text-text-muted"
      >
        Phase 8
      </span>
    </div>
  </header>

  <main id="main-content" class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
    <!-- URL Input -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
      Skip to main content
    </a>
    <form onsubmit={handleSubmit} class="mb-8 animate-fade-in" role="search" aria-label="Inspect a relay">
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
          <label for="relay-url" class="sr-only">Relay URL</label>
          <input
            id="relay-url"
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
            class="text-xs min-h-[44px] px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-text-muted hover:text-accent hover:border-accent-border transition-all"
          >
            {relay}
          </button>
        {/each}
      </div>
    </form>

    <!-- Navigation -->
    <NavBar {activeSection} onNavigate={handleNavigate} eventCount={socket.events.length} />

    <!-- Inspector Section -->
    {#if activeSection === 'inspector'}
      <InspectorSection
        url={normalizedUrl}
        {relayInfo}
        {connectionStatus}
        {loading}
        {error}
        {socket}
        {latency}
        {writeTest}
        {dbRelayId}
        onRetry={() => handleFetch()}
      />
    {/if}

    <!-- Event Verifier Section -->
    {#if activeSection === 'verifier'}
      <EventVerifier onEditAndRepublish={handleEditAndRepublish} />
    {/if}

    <!-- Publisher Section -->
    {#if activeSection === 'publisher'}
      <PublisherSection targetRelay={normalizedUrl} {prefilledEvent} />
    {/if}

    <!-- Tools Section -->
    {#if activeSection === 'tools'}
      <ToolsSection />
    {/if}

    <!-- Directory Section -->
    {#if activeSection === 'directory'}
      <RelayDirectory
        onSelectRelay={(relayUrl) => {
          url = relayUrl;
          activeSection = 'inspector';
          setHashSection('inspector');
          handleFetch(relayUrl);
        }}
      />
    {/if}

    <!-- Empty State -->
    {#if !loading && !error && !relayInfo && activeSection === 'inspector'}
      <section aria-label="Welcome" class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
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
            Live Stream
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            Event Verifier
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            Event Publisher
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            Key Converter
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            NIP-05 Checker
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            QR Code
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            Backup & Restore
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
            Relay Directory
          </span>
        </div>
      </section>
    {/if}
  </main>

  <!-- Mobile Navigation -->
  <MobileNav {activeSection} onNavigate={handleNavigate} />

  <!-- Footer -->
  <footer class="border-t border-dark-border mt-auto">
    <div
      class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-text-muted"
    >
      <span>Relay Dog · Nostr Relay Inspector</span>
      <span class="font-mono">v0.8.0</span>
    </div>
  </footer>
</div>
