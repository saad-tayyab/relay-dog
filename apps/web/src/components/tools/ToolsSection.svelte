<script lang="ts">
import * as Tabs from "$lib/components/ui/tabs";
import EventBackup from "./EventBackup.svelte";
import KeyConverter from "./KeyConverter.svelte";
import Nip05Checker from "./Nip05Checker.svelte";
import QRCodeGenerator from "./QRCodeGenerator.svelte";

let activeTool = $state<
	"key-converter" | "nip05-checker" | "qr-code" | "event-backup"
>("key-converter");

const tools = [
	{ id: "key-converter" as const, label: "Key Converter", icon: "🔑" },
	{ id: "nip05-checker" as const, label: "NIP-05 Checker", icon: "📧" },
	{ id: "qr-code" as const, label: "QR Code", icon: "📱" },
	{ id: "event-backup" as const, label: "Backup", icon: "💾" },
];
</script>

<div class="flex flex-col gap-7">
  <Tabs.Root value={activeTool} onValueChange={(id) => (activeTool = id as typeof activeTool)} aria-label="Developer tools">
    <Tabs.List variant="line" class="flex w-full gap-1 border-b border-border p-0">
      {#each tools as tool (tool.id)}
        <Tabs.Trigger value={tool.id} class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-primary">
          <span aria-hidden="true">{tool.icon}</span>
          {tool.label}
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    <Tabs.Content value={activeTool} class="pt-5 focus:outline-none">
    {#if activeTool === 'key-converter'}
      <KeyConverter />
    {:else if activeTool === 'nip05-checker'}
      <Nip05Checker />
    {:else if activeTool === 'qr-code'}
      <QRCodeGenerator />
    {:else if activeTool === 'event-backup'}
      <EventBackup />
    {/if}
    </Tabs.Content>
  </Tabs.Root>
</div>
