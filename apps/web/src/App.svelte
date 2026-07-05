<script lang="ts">
import { getHashSection, type Section, setHashSection } from "./utils/router";
import "./index.css";

import { toast } from "svelte-sonner";
import * as Empty from "$lib/components/ui/empty";
import { Toaster } from "$lib/components/ui/sonner";
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

$effect(() => {
	if (!inspector.toast.visible || !inspector.toast.message) return;

	const id = toast(inspector.toast.message, {
		duration: inspector.toast.duration,
		action:
			inspector.toast.undoLabel && inspector.toast.onUndo
				? {
					label: inspector.toast.undoLabel,
					onClick: inspector.toast.onUndo,
				}
				: undefined,
			description: undefined,
	});

	inspector.toast.hide();
	return () => {
		toast.dismiss(id);
	};
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
      <Empty.Root class="animate-fade-in py-20 text-center" aria-label="Welcome">
        <Empty.Header class="items-center">
          <Empty.Media class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
            <svg
              aria-hidden="true"
              class="h-10 w-10 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </Empty.Media>
          <Empty.Title class="mb-2 text-xl text-foreground">Inspect a Nostr Relay</Empty.Title>
          <Empty.Description class="mb-6 max-w-sm text-sm text-muted-foreground">Enter a relay URL above to fetch its NIP-11 info document, check connection status, and explore supported features.</Empty.Description>
        </Empty.Header>
        <Empty.Content class="!flex-row w-full max-w-none flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">NIP-11 Info</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Connection Checks</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Live Stream</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Event Verifier</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Event Publisher</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Key Converter</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">NIP-05 Checker</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">QR Code</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Backup & Restore</span>
          <span class="rounded-lg border border-border bg-card px-3 py-1.5">Relay Directory</span>
        </Empty.Content>
      </Empty.Root>
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

  <Toaster richColors position="bottom-center" />
</div>
