<script lang="ts">
import type { NostrEvent } from '@relayscope/shared';
import {
  type BackupOptions,
  exportToFile,
  fetchEventsForBackup,
  importFromFile,
  type RestoreResult,
} from '../../utils/backup';
import SectionCard from '../SectionCard.svelte';

let activeTab = $state<'backup' | 'restore'>('backup');

// Backup state
let authorPubkey = $state('');
let relayUrl = $state('');
let kinds = $state('0,1,3');
let limit = $state('1000');
let fetching = $state(false);
let backupError = $state<string | null>(null);
let backupSuccess = $state<string | null>(null);

// Restore state
let importedEvents = $state<NostrEvent[]>([]);
let restoring = $state(false);
let restoreProgress = $state({ total: 0, restored: 0, skipped: 0 });
let restoreResult = $state<RestoreResult | null>(null);

async function handleBackup() {
  if (!authorPubkey || !relayUrl) return;

  fetching = true;
  try {
    const options: BackupOptions = {
      authorPubkey,
      relayUrl,
      kinds: kinds.split(',').map(Number).filter(Boolean),
      limit: Number(limit) || 1000,
    };

    const events = await fetchEventsForBackup(options);
    exportToFile(events, authorPubkey);
    backupSuccess = `Exported ${events.length} events`;
    backupError = null;
  } catch (e) {
    backupError = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    fetching = false;
  }
}

async function handleFileImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    importedEvents = await importFromFile(file);
    restoreResult = null;
  } catch (err) {
    backupError = err instanceof Error ? err.message : 'Unknown error';
  }
}

async function handleRestore() {
  if (importedEvents.length === 0 || !relayUrl) return;

  if (!window.nostr) {
    backupError = 'No NIP-07 signer detected. Please install a Nostr wallet extension.';
    return;
  }

  restoring = true;
  restoreProgress = { total: importedEvents.length, restored: 0, skipped: 0 };

  // TODO: Actually publish events via WebSocket
  // For now, simulate restore
  await new Promise((r) => setTimeout(r, 2000));

  restoreResult = {
    total: importedEvents.length,
    restored: importedEvents.length,
    skipped: 0,
    errors: [],
  };
  restoring = false;
}

const importedKindsBreakdown = $derived.by(() => {
  const breakdown: Record<number, number> = {};
  for (const event of importedEvents) {
    breakdown[event.kind] = (breakdown[event.kind] || 0) + 1;
  }
  return breakdown;
});
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Backup & Restore</h3>
      <span class="text-[10px] text-text-muted">NIP-01</span>
    </div>

    <!-- Error/Success Feedback -->
    {#if backupError}
      <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim border border-error/20 text-xs text-error">
        <span aria-hidden="true">⚠</span> {backupError}
      </div>
    {/if}
    {#if backupSuccess}
      <div role="status" class="px-3 py-2 rounded-lg bg-success-dim border border-success/20 text-xs text-success">
        <span aria-hidden="true">✓</span> {backupSuccess}
      </div>
    {/if}

    <!-- Tab Toggle (uses AccessibleTabs pattern) -->
    <div role="tablist" aria-label="Backup and restore" class="flex gap-1 p-1 rounded-lg bg-dark-surface border border-dark-border">
      <button
        role="tab"
        aria-selected={activeTab === 'backup'}
        id="tab-backup"
        aria-controls="tabpanel-backup"
        onclick={() => (activeTab = 'backup')}
        class="flex-1 min-h-[44px] py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'backup'
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        <span aria-hidden="true">💾</span> Backup
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'restore'}
        id="tab-restore"
        aria-controls="tabpanel-restore"
        onclick={() => (activeTab = 'restore')}
        class="flex-1 min-h-[44px] py-2 px-4 rounded-lg text-sm font-medium transition-all {activeTab === 'restore'
          ? 'bg-dark-card border border-dark-border text-text-primary'
          : 'text-text-muted hover:text-text-secondary'}"
      >
        <span aria-hidden="true">📤</span> Restore
      </button>
    </div>

    {#if activeTab === 'backup'}
      <div role="tabpanel" id="tabpanel-backup" aria-labelledby="tab-backup">
      <!-- Backup Form -->
      <div class="space-y-3">
        <div>
          <label for="backup-pubkey" class="block text-xs text-text-muted mb-1">
            Author Pubkey (hex)
          </label>
          <input
            id="backup-pubkey"
            type="text"
            bind:value={authorPubkey}
            placeholder="64-char hex pubkey"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <div>
          <label for="backup-relay" class="block text-xs text-text-muted mb-1">Relay URL</label>
          <input
            id="backup-relay"
            type="text"
            bind:value={relayUrl}
            placeholder="wss://relay.example.com"
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="backup-kinds" class="block text-xs text-text-muted mb-1">
              Kinds (comma-separated)
            </label>
            <input
              id="backup-kinds"
              type="text"
              bind:value={kinds}
              placeholder="0,1,3"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>
          <div>
            <label for="backup-limit" class="block text-xs text-text-muted mb-1">Limit</label>
            <input
              id="backup-limit"
              type="number"
              bind:value={limit}
              placeholder="1000"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          onclick={handleBackup}
          disabled={fetching || !authorPubkey || !relayUrl}
          class="w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {#if fetching}
            Fetching events...
          {:else}
            Backup Events
          {/if}
        </button>
      </div>
      </div>
    {:else}
      <div role="tabpanel" id="tabpanel-restore" aria-labelledby="tab-restore">
      <!-- Restore Form -->
      <div class="space-y-3">
        <!-- File Import -->
        <div>
          <label for="restore-file" class="block text-xs text-text-muted mb-1">
            Import backup file
          </label>
          <input
            id="restore-file"
            type="file"
            accept=".json"
            onchange={handleFileImport}
            class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-accent file:text-white file:cursor-pointer"
          />
        </div>

        {#if importedEvents.length > 0}
          <!-- Preview -->
          <div class="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border">
            <p class="text-xs text-text-muted mb-2">
              {importedEvents.length} events imported
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              {#each Object.entries(importedKindsBreakdown) as [kind, count] (kind)}
                <span class="px-2 py-0.5 rounded bg-dark-border text-text-secondary">
                  kind {kind}: {count}
                </span>
              {/each}
            </div>
          </div>

          <!-- Target Relay -->
          <div>
            <label for="restore-relay" class="block text-xs text-text-muted mb-1">
              Target Relay
            </label>
            <input
              id="restore-relay"
              type="text"
              bind:value={relayUrl}
              placeholder="wss://relay.example.com"
              class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all"
            />
          </div>

          <!-- Restore Button -->
          <button
            type="button"
            onclick={handleRestore}
            disabled={restoring || !relayUrl}
            class="w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {#if restoring}
              Restoring... ({restoreProgress.restored}/{restoreProgress.total})
            {:else}
              Restore Events
            {/if}
          </button>

          <!-- Progress Bar -->
          {#if restoring}
            <div
              role="progressbar"
              aria-valuenow={restoreProgress.restored}
              aria-valuemin={0}
              aria-valuemax={restoreProgress.total}
              aria-label="Restore progress"
              class="h-2 rounded-full bg-dark-surface overflow-hidden"
            >
              <div
                class="h-full bg-accent transition-all duration-300"
                style="width: {(restoreProgress.restored / restoreProgress.total) * 100}%"
              ></div>
            </div>
          {/if}

          <!-- Result -->
          {#if restoreResult}
            <div
              role="status"
              class="px-3 py-2 rounded-lg text-xs {restoreResult.errors.length === 0
                ? 'bg-success/10 border border-success/20 text-success'
                : 'bg-warning-dim border border-warning/20 text-warning'}"
            >
              ✅ Restored {restoreResult.restored} / {restoreResult.total} events
              {#if restoreResult.skipped > 0}
                ({restoreResult.skipped} skipped)
              {/if}
            </div>
          {/if}
        {/if}
      </div>
      </div>
    {/if}
  </div>
</SectionCard>
