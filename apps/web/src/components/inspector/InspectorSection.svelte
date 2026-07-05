<script lang="ts">

// 1. Internal packages (stores, utils)

import * as Alert from "$lib/components/ui/alert";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Collapsible from "$lib/components/ui/collapsible";
import { Spinner } from "$lib/components/ui/spinner";
import * as Tabs from "$lib/components/ui/tabs";
import type { relaySocket } from "../../lib/stores/relaySocket.svelte";
import type { ConnectionStatus, RelayInfo } from "../../utils/relay";
import AuthStatusBadge from "../auth/AuthStatusBadge.svelte";
import ConnectionPanel from "../connection/ConnectionPanel.svelte";
import ConnectionStatusPanel from "../connection/ConnectionStatusPanel.svelte";
import LatencyPanel from "../connection/LatencyPanel.svelte";
import WriteTestPanel from "../connection/WriteTestPanel.svelte";
import EventFeed from "../event/EventFeed.svelte";
import FilterBuilder from "../filter/FilterBuilder.svelte";
import FeeDisplay from "../nip11/FeeDisplay.svelte";
import LimitationsPanel from "../nip11/LimitationsPanel.svelte";
import NipBadgeGrid from "../nip11/NipBadgeGrid.svelte";
// 2. Relative component imports
import AddToDirectory from "../relay/AddToDirectory.svelte";
import RelayProfile from "../relay/RelayProfile.svelte";

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
	inDirectory,
	onRetry,
	onInDirectoryChange,
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
		status: "idle" | "testing" | "success" | "failed";
		latencyMs: number | null;
		error: string | null;
		eventId: string | null;
		runTest: (url: string) => void;
		reset: () => void;
	};
	dbRelayId: string | null;
	inDirectory: boolean;
	onRetry: () => void;
	onInDirectoryChange: (
		inDir: boolean,
		relayId?: string,
		relayUrl?: string,
	) => void;
} = $props();

let activeTab = $state<"nip11" | "stream">("nip11");
let jsonOpen = $state(false);

const tabs = $derived([
	{ id: "nip11" as const, label: "NIP-11 Info" },
	{
		id: "stream" as const,
		label: "Live Stream",
		badge:
			socket.events.length > 0 ? socket.events.length.toLocaleString() : null,
	},
]);
</script>

<div class="space-y-5">
  <Tabs.Root value={activeTab} onValueChange={(id) => (activeTab = id as typeof activeTab)} aria-label="Inspector views">
    <Tabs.List variant="line" class="flex w-full gap-1 border-b border-border p-0">
      {#each tabs as tab (tab.id)}
        <Tabs.Trigger value={tab.id} class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-primary">
          {tab.label}
          {#if tab.badge}
            <span class="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary">
              {tab.badge}
            </span>
          {/if}
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    <Tabs.Content value={activeTab} class="pt-5 focus:outline-none">
    {#if activeTab === 'nip11'}
      <!-- NIP-11 Info View -->
      {#if loading}
        <div role="status" aria-label="Loading" class="flex items-center justify-center py-16">
          <Spinner class="size-12 text-primary" />
        </div>
      {/if}

      {#if !loading && error && !relayInfo}
        <div class="animate-fade-in py-10">
          <Alert.Root variant="destructive" class="mx-auto max-w-xl">
            <svg
              aria-hidden="true"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <Alert.Title>Failed to fetch relay info</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
            <Alert.Action>
              <Button type="button" variant="outline" onclick={onRetry} class="min-h-[44px]">
                Try again
              </Button>
            </Alert.Action>
          </Alert.Root>
        </div>
      {/if}

      {#if !loading && relayInfo}
<div class="space-y-7">
          <RelayProfile relayId={dbRelayId ?? undefined} relay={{ url }} info={relayInfo} />

          <!-- Add to Directory — shows prompt after inspect, or status when already in directory -->
          <AddToDirectory
            relayUrl={url}
            relayName={relayInfo.name ?? undefined}
            {inDirectory}
            onAdded={(id) => onInDirectoryChange(true, id, url)}
            {onInDirectoryChange}
          />

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
          <Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
            <Collapsible.Root bind:open={jsonOpen}>
              <Collapsible.Trigger
                class="cursor-pointer text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 py-2"
              >
                <svg
                  aria-hidden="true"
                  class="w-4 h-4 transition-transform data-[state=open]:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Raw NIP-11 JSON
              </Collapsible.Trigger>
              <Collapsible.Content>
                <pre
                  class="mt-2 p-4 rounded-xl bg-dark-surface border border-dark-border text-xs text-text-secondary overflow-x-auto font-mono leading-relaxed">{JSON.stringify(
                    relayInfo,
                    null,
                    2,
                  )}</pre>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Content></Card.Root>

          <!-- Error details if connection had issues -->
          {#if !loading && error && relayInfo}
            <div
              role="alert"
              class="px-3 py-2 rounded-lg bg-warning-dim border border-warning/20 text-sm text-warning"
            >
              <span aria-hidden="true">⚠</span> {error}
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
          <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-sm text-error">
            <span aria-hidden="true">⚠</span> {socket.authError}
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
    </Tabs.Content>
  </Tabs.Root>
</div>
