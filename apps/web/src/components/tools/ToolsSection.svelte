<script lang="ts">
import EventBackup from './EventBackup.svelte';
import KeyConverter from './KeyConverter.svelte';
import Nip05Checker from './Nip05Checker.svelte';
import QRCodeGenerator from './QRCodeGenerator.svelte';

let activeTool = $state<'key-converter' | 'nip05-checker' | 'qr-code' | 'event-backup'>(
  'key-converter',
);

const tools = [
  { id: 'key-converter' as const, label: 'Key Converter', icon: '🔑' },
  { id: 'nip05-checker' as const, label: 'NIP-05 Checker', icon: '📧' },
  { id: 'qr-code' as const, label: 'QR Code', icon: '📱' },
  { id: 'event-backup' as const, label: 'Backup', icon: '💾' },
];
</script>

<div class="space-y-4">
  <!-- Tool Tabs -->
  <div class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
    {#each tools as tool (tool.id)}
      <button
        type="button"
        onclick={() => (activeTool = tool.id)}
        class="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all {activeTool === tool.id
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        {tool.icon} {tool.label}
      </button>
    {/each}
  </div>

  <!-- Tool Content -->
  {#if activeTool === 'key-converter'}
    <KeyConverter />
  {:else if activeTool === 'nip05-checker'}
    <Nip05Checker />
  {:else if activeTool === 'qr-code'}
    <QRCodeGenerator />
  {:else if activeTool === 'event-backup'}
    <EventBackup />
  {/if}
</div>
