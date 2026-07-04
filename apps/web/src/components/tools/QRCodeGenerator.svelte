<script lang="ts">
import QRCode from 'qrcode';
import { detectKeyFormat } from '../../utils/keys';
import SectionCard from '../ui/SectionCard.svelte';

let input = $state('');
let qrDataUrl = $state<string | null>(null);
let size = $state<200 | 300 | 500>(300);
let detectedType = $state<string>('text');

function generateQR() {
  if (!input.trim()) {
    qrDataUrl = null;
    return;
  }

  QRCode.toDataURL(input.trim(), {
    width: size,
    margin: 2,
    color: {
      dark: '#ffffff',
      light: '#1a1a2e',
    },
  }).then((url) => {
    qrDataUrl = url;
  });
}

function detectType(value: string): string {
  if (detectKeyFormat(value) === 'npub') return 'npub';
  if (value.startsWith('wss://') || value.startsWith('ws://')) return 'relay';
  try {
    JSON.parse(value);
    return 'event';
  } catch {
    return 'text';
  }
}

function handleInput() {
  detectedType = detectType(input);
  generateQR();
}

function downloadQR() {
  if (!qrDataUrl) return;
  const a = document.createElement('a');
  a.href = qrDataUrl;
  a.download = `nostr-qr-${detectedType}.png`;
  a.click();
}

async function copyImage() {
  if (!qrDataUrl) return;
  try {
    const res = await fetch(qrDataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch {
    // Clipboard API not available or denied
  }
}
</script>

<SectionCard>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">QR Code Generator</h3>
      <span class="text-[10px] text-text-muted">{detectedType}</span>
    </div>

    <!-- Input -->
    <div>
      <label for="qr-input" class="block text-xs text-text-muted mb-1">
        Enter npub, relay URL, event JSON, or any text
      </label>
      <textarea
        id="qr-input"
        bind:value={input}
        oninput={handleInput}
        placeholder={"npub1... or wss://relay.example.com or event json"}
        rows="3"
        class="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-all font-mono resize-none"
      ></textarea>
    </div>

    <!-- Size Selector -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-text-muted">Size:</span>
      {#each [200, 300, 500] as s (s)}
        <button
          type="button"
          aria-pressed={size === s}
          onclick={() => { size = s as 200 | 300 | 500; generateQR(); }}
          class="min-h-[44px] px-3 py-2 rounded-lg text-xs transition-all {size === s
            ? 'bg-accent text-white'
            : 'bg-dark-surface border border-dark-border text-text-muted hover:text-text-primary'}"
        >
          {s}px
        </button>
      {/each}
    </div>

    <!-- QR Code Preview -->
    {#if qrDataUrl}
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 rounded-xl bg-white">
          <img src={qrDataUrl} alt="QR code for: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}" width={size} height={size} />
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            type="button"
            aria-label="Download QR code as PNG"
            onclick={downloadQR}
            class="min-h-[44px] px-4 py-2.5 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent transition-all"
          >
            Download PNG
          </button>
          <button
            type="button"
            aria-label="Copy QR code image to clipboard"
            onclick={copyImage}
            class="min-h-[44px] px-4 py-2.5 rounded-lg bg-dark-surface border border-dark-border text-xs text-text-primary hover:text-accent transition-all"
          >
            Copy Image
          </button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12 text-text-muted text-xs">
        Enter content above to generate QR code
      </div>
    {/if}
  </div>
</SectionCard>
