<script lang="ts">
import * as Empty from "$lib/components/ui/empty";
</script>

<Empty.Root class="animate-fade-in py-20 text-center" aria-label="Welcome">
  <Empty.Header class="items-center">
    <Empty.Media class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-dark-border bg-dark-card">
      <svg
        aria-hidden="true"
        class="h-10 w-10 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    </Empty.Media>
    <Empty.Title class="mb-2 text-xl text-text-primary">Inspect a Nostr Relay</Empty.Title>
    <Empty.Description class="mb-6 max-w-sm text-sm text-text-muted">Enter a relay URL above to fetch its NIP-11 info document, check connection status, and explore supported features.</Empty.Description>
  </Empty.Header>
  <Empty.Content class="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">NIP-11 Info</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Connection Checks</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Live Stream</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Event Verifier</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Event Publisher</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Key Converter</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">NIP-05 Checker</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">QR Code</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Backup & Restore</span>
    <span class="rounded-lg border border-dark-border bg-dark-card px-3 py-1.5">Relay Directory</span>
  </Empty.Content>
</Empty.Root>
