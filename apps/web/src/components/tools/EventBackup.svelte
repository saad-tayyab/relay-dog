<script lang="ts">
import type { NostrEvent } from "@relayscope/shared";
import { SimplePool } from "nostr-tools/pool";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Progress from "$lib/components/ui/progress";
import * as Tabs from "$lib/components/ui/tabs";
import {
	type BackupOptions,
	exportToFile,
	fetchEventsForBackup,
	importFromFile,
	type RestoreResult,
} from "../../utils/backup";

let activeTab = $state<"backup" | "restore">("backup");

const tabs = [
	{ id: "backup" as const, label: "Backup", icon: "💾" },
	{ id: "restore" as const, label: "Restore", icon: "📤" },
];

// Backup state
let authorPubkey = $state("");
let relayUrl = $state("");
let kinds = $state("0,1,3");
let limit = $state("1000");
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
			kinds: kinds.split(",").map(Number).filter(Boolean),
			limit: Number(limit) || 1000,
		};

		const events = await fetchEventsForBackup(options);
		exportToFile(events, authorPubkey);
		backupSuccess = `Exported ${events.length} events`;
		backupError = null;
	} catch (e) {
		backupError = e instanceof Error ? e.message : "Unknown error";
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
		backupError = err instanceof Error ? err.message : "Unknown error";
	}
}

async function handleRestore() {
	if (importedEvents.length === 0 || !relayUrl) return;

	// Concurrency guard
	if (restoring) return;

	restoring = true;
	backupError = null;
	restoreProgress = { total: importedEvents.length, restored: 0, skipped: 0 };

	const pool = new SimplePool();
	let restored = 0;
	let skipped = 0;
	const errors: string[] = [];

	try {
		const publishPromises = importedEvents.map(async (event) => {
			try {
				const pubs = pool.publish([relayUrl], event);
				// 10-second timeout per event
				const timeout = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Publish timed out")), 10_000),
				);
				await Promise.race([pubs, timeout]);
				restored++;
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				errors.push(`Event ${event.id?.slice(0, 8) || "unknown"}: ${msg}`);
			}
			restoreProgress = { total: importedEvents.length, restored, skipped };
		});

		await Promise.allSettled(publishPromises);
	} finally {
		pool.close([relayUrl]);
		restoreResult = {
			total: importedEvents.length,
			restored,
			skipped,
			errors,
		};
		restoring = false;
	}
}

const importedKindsBreakdown = $derived.by(() => {
	const breakdown: Record<number, number> = {};
	for (const event of importedEvents) {
		breakdown[event.kind] = (breakdown[event.kind] || 0) + 1;
	}
	return breakdown;
});
</script>

<Card.Root class="rounded-2xl border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"><Card.Content class="p-5 lg:p-6">
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">Event Backup & Restore</h3>
      <span class="text-xs text-text-muted">NIP-01</span>
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

    <Tabs.Root value={activeTab} onValueChange={(id) => (activeTab = id as typeof activeTab)} aria-label="Backup and restore">
      <Tabs.List variant="line" class="flex w-full gap-1 border-b border-border p-0">
        {#each tabs as tab (tab.id)}
          <Tabs.Trigger value={tab.id} class="min-h-[44px] rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-primary">
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </Tabs.Trigger>
        {/each}
      </Tabs.List>

      <Tabs.Content value={activeTab} class="pt-5 focus:outline-none">
      {#if activeTab === 'backup'}
        <!-- Backup Form -->
        <div class="space-y-3">
          <Field.Field>
            <Label for="backup-pubkey" class="text-xs text-text-muted">
              Author Pubkey (hex)
            </Label>
            <Input
              id="backup-pubkey"
              type="text"
              bind:value={authorPubkey}
              placeholder="64-char hex pubkey"
              class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-xs text-text-primary placeholder:text-text-muted"
            />
          </Field.Field>

          <Field.Field>
            <Label for="backup-relay" class="text-xs text-text-muted">Relay URL</Label>
            <Input
              id="backup-relay"
              type="text"
              bind:value={relayUrl}
              placeholder="wss://relay.example.com"
              class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-sm text-text-primary placeholder:text-text-muted"
            />
          </Field.Field>

          <div class="grid grid-cols-2 gap-3">
            <Field.Field>
              <Label for="backup-kinds" class="text-xs text-text-muted">
                Kinds (comma-separated)
              </Label>
              <Input
                id="backup-kinds"
                type="text"
                bind:value={kinds}
                placeholder="0,1,3"
                class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-xs text-text-primary placeholder:text-text-muted"
              />
            </Field.Field>
            <Field.Field>
              <Label for="backup-limit" class="text-xs text-text-muted">Limit</Label>
              <Input
                id="backup-limit"
                type="number"
                bind:value={limit}
                placeholder="1000"
                class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-xs text-text-primary placeholder:text-text-muted"
              />
            </Field.Field>
          </div>

          <Button
            variant="default"
            onclick={handleBackup}
            disabled={fetching || !authorPubkey || !relayUrl}
            class="min-h-[44px] w-full"
          >
            {#if fetching}
              Fetching events...
            {:else}
              Backup Events
            {/if}
          </Button>
        </div>
      {:else}
        <!-- Restore Form -->
        <div class="space-y-3">
          <!-- File Import -->
          <Field.Field>
            <Label for="restore-file" class="text-xs text-text-muted">
              Import backup file
            </Label>
            <Input
              id="restore-file"
              type="file"
              accept=".json"
              onchange={handleFileImport}
              class="h-11 border-dark-border bg-dark-surface px-3 text-sm text-text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:text-white file:cursor-pointer"
            />
          </Field.Field>

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
            <Field.Field>
              <Label for="restore-relay" class="text-xs text-text-muted">
                Target Relay
              </Label>
              <Input
                id="restore-relay"
                type="text"
                bind:value={relayUrl}
                placeholder="wss://relay.example.com"
                class="h-11 border-dark-border bg-dark-surface px-3 font-mono text-sm text-text-primary placeholder:text-text-muted"
              />
            </Field.Field>

            <!-- Restore Button -->
            <Button
              variant="default"
              onclick={handleRestore}
              disabled={restoring || !relayUrl}
              class="min-h-[44px] w-full"
            >
              {#if restoring}
                Restoring... ({restoreProgress.restored}/{restoreProgress.total})
              {:else}
                Restore Events
              {/if}
            </Button>

            <!-- Progress Bar -->
            {#if restoring}
              <Progress.Root
                max={restoreProgress.total || 1}
                value={restoreProgress.restored}
                aria-label="Restore progress"
                class="h-2"
              />
            {/if}

            <!-- Result -->
            {#if restoreResult}
              <div
                role="status"
                class="px-3 py-2 rounded-lg text-xs {restoreResult.errors.length === 0
                  ? 'bg-success-dim border border-success/20 text-success'
                  : 'bg-warning-dim border border-warning/20 text-warning'}"
              >
                <span aria-hidden="true">✓</span> Restored {restoreResult.restored} / {restoreResult.total} events
                {#if restoreResult.skipped > 0}
                  ({restoreResult.skipped} skipped)
                {/if}
              </div>
            {/if}
          {/if}
        </div>
      {/if}
      </Tabs.Content>
    </Tabs.Root>
  </div>
</Card.Content></Card.Root>
