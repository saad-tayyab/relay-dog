<script lang="ts">
import { getHashSection, type Section, setHashSection } from "./utils/router";
import "./index.css";

import { EmptyState, Toast } from "@relayscope/ui";
// Components
import InspectorSection from "./components/inspector/InspectorSection.svelte";
import MobileNav from "./components/nav/MobileNav.svelte";
import NavBar from "./components/nav/NavBar.svelte";
import PublisherSection from "./components/publisher/PublisherSection.svelte";
import RelayDirectory from "./components/relay/RelayDirectory.svelte";
import SearchBar from "./components/search/SearchBar.svelte";
import ToolsSection from "./components/tools/ToolsSection.svelte";
import EventVerifier from "./components/verifier/EventVerifier.svelte";

// Composables
import { useRelayInspector } from "./lib/composables/useRelayInspector.svelte";

// ─── State ───

let activeSection = $state<Section>(getHashSection());
let prefilledEvent = $state<unknown>(null);

// biome-ignore lint/correctness/useHookAtTopLevel: Svelte 5 composable pattern
const inspector = useRelayInspector();

// ─── Navigation ───

function handleNavigate(section: Section) {
	activeSection = section;
	setHashSection(section);
}

$effect(() => {
	function onHashChange() {
		activeSection = getHashSection();
	}
	window.addEventListener("hashchange", onHashChange);
	return () => window.removeEventListener("hashchange", onHashChange);
});

function handleEditAndRepublish(event: unknown) {
	prefilledEvent = event;
	activeSection = "publisher";
	setHashSection("publisher");
}
</script>

<div class="min-h-screen bg-dark-bg">
  <!-- Header -->
  <header class="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-content xl:max-w-content-xl 2xl:max-w-content-2xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
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
    </div>
  </header>

  <main id="main-content" class="max-w-content xl:max-w-content-xl 2xl:max-w-content-2xl mx-auto px-5 sm:px-8 lg:px-10 py-10 pb-24 sm:pb-10">
    <!-- URL Input -->
    <SearchBar
      bind:url={inspector.url}
      loading={inspector.loading}
      onSubmit={inspector.handleSubmit}
      onQuickPick={inspector.handleQuickPick}
    />

    <!-- Navigation -->
    <NavBar {activeSection} onNavigate={handleNavigate} eventCount={inspector.socket.events.length} />

    <!-- Inspector Section -->
    {#if activeSection === 'inspector'}
      <InspectorSection
        url={inspector.normalizedUrl}
        relayInfo={inspector.relayInfo}
        connectionStatus={inspector.connectionStatus}
        loading={inspector.loading}
        error={inspector.error}
        socket={inspector.socket}
        latency={inspector.latency}
        writeTest={inspector.writeTest}
        dbRelayId={inspector.dbRelayId}
        inDirectory={inspector.inDirectory}
        onRetry={() => inspector.handleFetch()}
        onInDirectoryChange={inspector.handleInDirectoryChange}
      />
    {/if}

    <!-- Event Verifier Section -->
    {#if activeSection === 'verifier'}
      <EventVerifier onEditAndRepublish={handleEditAndRepublish} />
    {/if}

    <!-- Publisher Section -->
    {#if activeSection === 'publisher'}
      <PublisherSection targetRelay={inspector.normalizedUrl} {prefilledEvent} />
    {/if}

    <!-- Tools Section -->
    {#if activeSection === 'tools'}
      <ToolsSection />
    {/if}

    <!-- Directory Section -->
    {#if activeSection === 'directory'}
      <RelayDirectory
        onSelectRelay={(relayUrl) => {
          inspector.url = relayUrl;
          activeSection = 'inspector';
          setHashSection('inspector');
          inspector.handleFetch(relayUrl);
        }}
      />
    {/if}

    <!-- Empty State -->
    {#if !inspector.loading && !inspector.error && !inspector.relayInfo && activeSection === 'inspector'}
      <EmptyState />
    {/if}
  </main>

  <!-- Mobile Navigation -->
  <MobileNav {activeSection} onNavigate={handleNavigate} />

  <!-- Footer -->
  <footer class="border-t border-dark-border mt-auto">
    <div
      class="max-w-content xl:max-w-content-xl 2xl:max-w-content-2xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between text-xs text-text-muted"
    >
      <span>Relay Dog · Nostr Relay Inspector</span>
      <span class="font-mono">v0.10.0</span>
    </div>
  </footer>

  <!-- Toast notification -->
  {#if inspector.toast.visible}
    {#key inspector.toast.key}
      <Toast
        message={inspector.toast.message}
        type={inspector.toast.type}
        duration={inspector.toast.duration}
        undoLabel={inspector.toast.undoLabel}
        onUndo={inspector.toast.onUndo}
        onDismiss={() => inspector.toast.hide()}
      />
    {/key}
  {/if}
</div>
