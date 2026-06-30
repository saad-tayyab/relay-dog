<script lang="ts">
import AccessibleTabs from '../shared/AccessibleTabs.svelte';
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
  <AccessibleTabs
    ariaLabel="Developer tools"
    tabs={tools}
    activeTab={activeTool}
    onTabChange={(id) => (activeTool = id as typeof activeTool)}
  >
    {#if activeTool === 'key-converter'}
      <KeyConverter />
    {:else if activeTool === 'nip05-checker'}
      <Nip05Checker />
    {:else if activeTool === 'qr-code'}
      <QRCodeGenerator />
    {:else if activeTool === 'event-backup'}
      <EventBackup />
    {/if}
  </AccessibleTabs>
</div>
